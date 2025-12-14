import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { googleSheetsChannel } from "@/inngest/channels/google-sheets";
import prisma from "@/lib/db";
import { decrypy } from "@/lib/encryption";
import { google } from "googleapis";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

type GoogleSheetsData = {
  variableName?: string;
  credentialId?: string;
  spreadsheetId?: string;
  sheetName?: string;
  range?: string;
  operation?: "read" | "append" | "write";
  data?: string;
};

export const googleSheetsExecutor: NodeExecutor<GoogleSheetsData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    googleSheetsChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      googleSheetsChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Google Sheets node: variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      googleSheetsChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Google Sheets node: credential is missing");
  }

  if (!data.spreadsheetId) {
    await publish(
      googleSheetsChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError(
      "Google Sheets node: spreadsheet ID is missing"
    );
  }

  const operation = data.operation || "read";
  const sheetName = data.sheetName || "Sheet1";
  const range = data.range || "A:Z";
  const fullRange = `${sheetName}!${range}`;

  try {
    // Get credential from database
    const credential = await prisma.credential.findFirst({
      where: {
        id: data.credentialId,
        userId,
      },
    });

    if (!credential) {
      await publish(
        googleSheetsChannel().status({
          nodeId,
          status: "error",
        })
      );
      throw new NonRetriableError("Google Sheets node: credential not found");
    }

    // Decrypt and parse service account credentials
    const decryptedValue = decrypy(credential.value);
    const serviceAccountKey = JSON.parse(decryptedValue);

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    let result: Record<string, unknown> = {};

    if (operation === "read") {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: data.spreadsheetId,
        range: fullRange,
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);

      // Convert to array of objects with headers as keys
      const records = dataRows.map((row) => {
        const record: Record<string, unknown> = {};
        headers.forEach((header: string, index: number) => {
          record[header] = row[index] || "";
        });
        return record;
      });

      result = {
        rows: rows,
        records: records,
        headers: headers,
        rowCount: dataRows.length,
      };
    } else if (operation === "append" || operation === "write") {
      if (!data.data) {
        await publish(
          googleSheetsChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError(
          "Google Sheets node: data is required for append/write operations"
        );
      }

      // Process handlebars in data
      const processedData = Handlebars.compile(data.data)(context);
      const values = JSON.parse(processedData);

      if (operation === "append") {
        const response = await sheets.spreadsheets.values.append({
          spreadsheetId: data.spreadsheetId,
          range: fullRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: values,
          },
        });

        result = {
          updatedRange: response.data.updates?.updatedRange,
          updatedRows: response.data.updates?.updatedRows,
          updatedCells: response.data.updates?.updatedCells,
        };
      } else {
        // write operation
        const response = await sheets.spreadsheets.values.update({
          spreadsheetId: data.spreadsheetId,
          range: fullRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: values,
          },
        });

        result = {
          updatedRange: response.data.updatedRange,
          updatedRows: response.data.updatedRows,
          updatedCells: response.data.updatedCells,
        };
      }
    }

    await publish(
      googleSheetsChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      ...context,
      [data.variableName]: result,
    };
  } catch (error) {
    await publish(
      googleSheetsChannel().status({
        nodeId,
        status: "error",
      })
    );
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError(
      `Google Sheets node: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
