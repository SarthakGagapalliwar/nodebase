import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { dataFilterChannel } from "@/inngest/channels/data-filter";

type DataFilterData = {
  variableName?: string;
  sourceVariable?: string;
  filterType?:
    | "top_percent"
    | "top_n"
    | "bottom_percent"
    | "bottom_n"
    | "condition";
  sortField?: string;
  sortOrder?: "asc" | "desc";
  value?: string;
  conditionField?: string;
  conditionOperator?:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "starts_with"
    | "ends_with";
  conditionValue?: string;
};

// Helper to get nested value from object path like "mySheets.records"
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// Compare function for sorting
function compareValues(a: unknown, b: unknown, order: "asc" | "desc"): number {
  const aNum = Number(a);
  const bNum = Number(b);

  if (!isNaN(aNum) && !isNaN(bNum)) {
    return order === "asc" ? aNum - bNum : bNum - aNum;
  }

  const aStr = String(a);
  const bStr = String(b);

  return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
}

// Check condition
function checkCondition(
  value: unknown,
  operator: string,
  compareValue: string
): boolean {
  const strValue = String(value);
  const numValue = Number(value);
  const numCompare = Number(compareValue);

  switch (operator) {
    case "eq":
      return strValue === compareValue || numValue === numCompare;
    case "neq":
      return strValue !== compareValue && numValue !== numCompare;
    case "gt":
      return numValue > numCompare;
    case "gte":
      return numValue >= numCompare;
    case "lt":
      return numValue < numCompare;
    case "lte":
      return numValue <= numCompare;
    case "contains":
      return strValue.toLowerCase().includes(compareValue.toLowerCase());
    case "starts_with":
      return strValue.toLowerCase().startsWith(compareValue.toLowerCase());
    case "ends_with":
      return strValue.toLowerCase().endsWith(compareValue.toLowerCase());
    default:
      return false;
  }
}

export const dataFilterExecutor: NodeExecutor<DataFilterData> = async ({
  data,
  nodeId,
  context,
  publish,
}) => {
  await publish(
    dataFilterChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      dataFilterChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Data Filter node: variable name is missing");
  }

  if (!data.sourceVariable) {
    await publish(
      dataFilterChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Data Filter node: source variable is missing");
  }

  if (!data.filterType) {
    await publish(
      dataFilterChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Data Filter node: filter type is missing");
  }

  try {
    // Get source data from context
    const sourceData = getNestedValue(context, data.sourceVariable);

    if (!Array.isArray(sourceData)) {
      await publish(
        dataFilterChannel().status({
          nodeId,
          status: "error",
        })
      );
      throw new NonRetriableError(
        `Data Filter node: source '${data.sourceVariable}' is not an array`
      );
    }

    let items = [...sourceData];
    const originalCount = items.length;

    // Handle percentage/N based filtering
    if (
      ["top_percent", "top_n", "bottom_percent", "bottom_n"].includes(
        data.filterType
      )
    ) {
      if (!data.sortField) {
        await publish(
          dataFilterChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError(
          "Data Filter node: sort field is required for top/bottom filtering"
        );
      }

      const sortOrder = data.sortOrder || "desc";

      // Sort items
      items.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[data.sortField!];
        const bVal = (b as Record<string, unknown>)[data.sortField!];
        return compareValues(aVal, bVal, sortOrder);
      });

      const value = Number(data.value) || 10;
      let count: number;

      if (
        data.filterType === "top_percent" ||
        data.filterType === "bottom_percent"
      ) {
        count = Math.ceil((value / 100) * items.length);
      } else {
        count = Math.min(value, items.length);
      }

      if (
        data.filterType === "bottom_percent" ||
        data.filterType === "bottom_n"
      ) {
        items = items.slice(-count);
      } else {
        items = items.slice(0, count);
      }
    }

    // Handle condition-based filtering
    if (data.filterType === "condition") {
      if (!data.conditionField || !data.conditionOperator) {
        await publish(
          dataFilterChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError(
          "Data Filter node: condition field and operator are required"
        );
      }

      items = items.filter((item) => {
        const itemValue = (item as Record<string, unknown>)[
          data.conditionField!
        ];
        return checkCondition(
          itemValue,
          data.conditionOperator!,
          data.conditionValue || ""
        );
      });
    }

    await publish(
      dataFilterChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      ...context,
      [data.variableName]: {
        items,
        count: items.length,
        originalCount,
        filterType: data.filterType,
      },
    };
  } catch (error) {
    await publish(
      dataFilterChannel().status({
        nodeId,
        status: "error",
      })
    );
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError(
      `Data Filter node: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
