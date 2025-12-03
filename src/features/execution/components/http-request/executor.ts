import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";

Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context,null,2);
    const SafeString= new Handlebars.SafeString(jsonString);

    return SafeString;
});

type HttpRequestData = {
  variableName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpReqestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  //Todo :pubish  "loading" state for hhtp request ;

  if (!data.endpoint) {
    //Todo Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: No endpoint");
  }
  if (!data.variableName) {
    //Todo Publish "error" state for http request
    throw new NonRetriableError(
      "HTTP Request node: Variable Name not configured"
    );
  }
  if (!data.method) {
    //Todo Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: Method not configured");
  }

  const result = await step.run("http-request", async () => {
    // http://{{todo.httpResponse.data.userld}}
    const endpoint = Handlebars.compile(data.endpoint)(context);
    const method = data.method;

    const options: KyOptions = { method };

    if (["POST", "PUT", "PATCH"].includes(method) && data.body) {
      const resolved = Handlebars.compile(data.body || {})(context);
      JSON.parse(resolved);
      options.body = resolved;
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    const response = await ky(endpoint, options);
    const contentType = response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    const responcePayload = {
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    };

    return {
      ...context,
      [data.variableName]: responcePayload,
    };
  });

  //Todo: Publish "success" state for hhtp request

  return result;
};
