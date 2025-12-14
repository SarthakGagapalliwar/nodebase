"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, LoaderIcon } from "lucide-react";

const AUTO_SAVE_DELAY = 1000;

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  sourceVariable: z.string().min(1, "Source variable is required"),
  filterType: z.enum([
    "top_percent",
    "top_n",
    "bottom_percent",
    "bottom_n",
    "condition",
  ]),
  sortField: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  value: z.string().min(1, "Value is required"),
  conditionField: z.string().optional(),
  conditionOperator: z
    .enum([
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "contains",
      "starts_with",
      "ends_with",
    ])
    .optional(),
  conditionValue: z.string().optional(),
});

export type DataFilterFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<DataFilterFormValues>;
}

export const DataFilterDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasSavedRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      sourceVariable: defaultValues.sourceVariable || "",
      filterType: defaultValues.filterType || "top_percent",
      sortField: defaultValues.sortField || "",
      sortOrder: defaultValues.sortOrder || "desc",
      value: defaultValues.value || "10",
      conditionField: defaultValues.conditionField || "",
      conditionOperator: defaultValues.conditionOperator || "eq",
      conditionValue: defaultValues.conditionValue || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        sourceVariable: defaultValues.sourceVariable || "",
        filterType: defaultValues.filterType || "top_percent",
        sortField: defaultValues.sortField || "",
        sortOrder: defaultValues.sortOrder || "desc",
        value: defaultValues.value || "10",
        conditionField: defaultValues.conditionField || "",
        conditionOperator: defaultValues.conditionOperator || "eq",
        conditionValue: defaultValues.conditionValue || "",
      });
      hasSavedRef.current = false;
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "myFilter";
  const watchFilterType = form.watch("filterType");
  const isPercentOrN = [
    "top_percent",
    "top_n",
    "bottom_percent",
    "bottom_n",
  ].includes(watchFilterType);
  const isCondition = watchFilterType === "condition";

  const handleAutoSave = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const isValid = await form.trigger();
      if (!isValid) return;

      isSavingRef.current = true;
      hasSavedRef.current = false;

      setTimeout(() => {
        onSubmit(values);
        isSavingRef.current = false;
        hasSavedRef.current = true;
      }, 100);
    },
    [form, onSubmit]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave(value as z.infer<typeof formSchema>);
      }, AUTO_SAVE_DELAY);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, handleAutoSave]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Data Filter Configuration
            {isSavingRef.current && (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            )}
            {hasSavedRef.current && !isSavingRef.current && (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Filter and sort data from previous nodes. Great for getting top
            performers, filtering by conditions, etc.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myFilter" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result:{" "}
                    {`{{${watchVariableName}.items}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceVariable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Data</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mySheets.records or formData.submissions"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Path to the array of items to filter (e.g.,{" "}
                    {`{{mySheets.records}}`})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filterType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filter Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select filter type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="top_percent">
                        Top Percentage (e.g., top 10%)
                      </SelectItem>
                      <SelectItem value="top_n">
                        Top N Items (e.g., top 5)
                      </SelectItem>
                      <SelectItem value="bottom_percent">
                        Bottom Percentage (e.g., bottom 10%)
                      </SelectItem>
                      <SelectItem value="bottom_n">
                        Bottom N Items (e.g., bottom 5)
                      </SelectItem>
                      <SelectItem value="condition">
                        Custom Condition
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isPercentOrN && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sortField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort By Field</FormLabel>
                        <FormControl>
                          <Input placeholder="score or totalMarks" {...field} />
                        </FormControl>
                        <FormDescription>Field name to sort by</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="desc">
                              Descending (highest first)
                            </SelectItem>
                            <SelectItem value="asc">
                              Ascending (lowest first)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchFilterType.includes("percent")
                          ? "Percentage"
                          : "Number of Items"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={
                            watchFilterType.includes("percent") ? "10" : "5"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {watchFilterType.includes("percent")
                          ? "Enter percentage (1-100)"
                          : "Enter number of items to select"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {isCondition && (
              <>
                <FormField
                  control={form.control}
                  name="conditionField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field to Check</FormLabel>
                      <FormControl>
                        <Input placeholder="status or email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="conditionOperator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operator</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="eq">Equals</SelectItem>
                            <SelectItem value="neq">Not Equals</SelectItem>
                            <SelectItem value="gt">Greater Than</SelectItem>
                            <SelectItem value="gte">
                              Greater Than or Equal
                            </SelectItem>
                            <SelectItem value="lt">Less Than</SelectItem>
                            <SelectItem value="lte">
                              Less Than or Equal
                            </SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="starts_with">
                              Starts With
                            </SelectItem>
                            <SelectItem value="ends_with">Ends With</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conditionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input placeholder="passed or 50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
