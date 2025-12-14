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
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef } from "react";
import { CredentialType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCredentialType } from "@/features/credentials/hooks/use-credentials";
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
  credentialId: z.string().min(1, "Credential is required"),
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetName: z.string().optional(),
  range: z.string().optional(),
  operation: z.enum(["read", "append", "write"]),
  data: z.string().optional(),
});

export type GoogleSheetsFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<GoogleSheetsFormValues>;
}

export const GoogleSheetsDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCreateCredentialType(CredentialType.GOOGLE_SHEETS);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasSavedRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      spreadsheetId: defaultValues.spreadsheetId || "",
      sheetName: defaultValues.sheetName || "Sheet1",
      range: defaultValues.range || "A:Z",
      operation: defaultValues.operation || "read",
      data: defaultValues.data || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        spreadsheetId: defaultValues.spreadsheetId || "",
        sheetName: defaultValues.sheetName || "Sheet1",
        range: defaultValues.range || "A:Z",
        operation: defaultValues.operation || "read",
        data: defaultValues.data || "",
      });
      hasSavedRef.current = false;
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "mySheets";
  const watchOperation = form.watch("operation");

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
            Google Sheets Configuration
            {isSavingRef.current && (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            )}
            {hasSavedRef.current && !isSavingRef.current && (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Configure Google Sheets operations. Changes are saved automatically.
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
                    <Input placeholder="mySheets" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result:{" "}
                    {`{{${watchVariableName}.rows}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential</FormLabel>
                  <Select
                    disabled={isLoadingCredentials}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a credential" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(credentials ?? []).map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          <span className="flex items-center gap-2">
                            <img
                              src="/logos/google-sheets.svg"
                              alt="Google Sheets"
                              className="size-4"
                            />
                            {credential.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your Google Sheets API credential (service account JSON
                    key).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spreadsheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spreadsheet ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Found in the spreadsheet URL after /d/ and before /edit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sheetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sheet Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sheet1" {...field} />
                    </FormControl>
                    <FormDescription>Name of the sheet tab</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Range</FormLabel>
                    <FormControl>
                      <Input placeholder="A:Z or A1:D100" {...field} />
                    </FormControl>
                    <FormDescription>Cell range to read/write</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="operation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="read">Read Data</SelectItem>
                      <SelectItem value="append">Append Row</SelectItem>
                      <SelectItem value="write">Write Data</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Read fetches data, Append adds a new row, Write overwrites.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(watchOperation === "append" || watchOperation === "write") && (
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data to Write</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='[["Name", "Score"], ["{{formTrigger.name}}", "{{formTrigger.score}}"]]'
                        className="min-h-[100px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      JSON array of rows. Use {"{{variables}}"} for dynamic
                      values.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
