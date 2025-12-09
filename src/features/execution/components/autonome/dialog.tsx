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
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
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
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "User prompt is required"),
});

export type AutonomeFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: z.infer<typeof formSchema>) => void;
  defalutValues?: Partial<AutonomeFormValues>;
}

export const AutonomeDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defalutValues = {},
}: Props) => {
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasSavedRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defalutValues.variableName || "",
      systemPrompt: defalutValues.systemPrompt || "",
      userPrompt: defalutValues.userPrompt || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defalutValues.variableName || "",
        systemPrompt: defalutValues.systemPrompt || "",
        userPrompt: defalutValues.userPrompt || "",
      });
      hasSavedRef.current = false;
    }
  }, [open, defalutValues, form]);

  const watchVariableName = form.watch("variableName") || "myAutonome";

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
            Autonome Configuration
            {isSavingRef.current && (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            )}
            {hasSavedRef.current && !isSavingRef.current && (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Configure the Autonome AI model and prompts for this node. Changes
            are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="mt-4 space-y-8">
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myAutonome" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result in other nodes:{" "}
                    {`{{${watchVariableName}.text}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant."
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Sets the assistant behavior. Use {"{{variable}}"} for simple
                    values or {"{{json variable}}"} to stringify objects.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize this text: {{json httpResponse.data}}"
                      className="min-h-[120px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The prompt to send to Autonome. Use {"{{variables}}"} for
                    simple values or {"{{json variable}}"} to stringify objects.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
