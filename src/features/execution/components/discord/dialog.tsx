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
  username: z.string().optional(),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(2000, "Discord message cannot exceed 2000 characters"),
  webhookUrl: z.string().min(1, "webhook URL is required"),
});

export type DiscordFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: z.infer<typeof formSchema>) => void;
  defalutValues?: Partial<DiscordFormValues>;
}

export const DiscordDialog = ({
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
      username: defalutValues.username || "",
      content: defalutValues.content || "",
      webhookUrl: defalutValues.webhookUrl || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defalutValues.variableName || "",
        username: defalutValues.username || "",
        content: defalutValues.content || "",
        webhookUrl: defalutValues.webhookUrl || "",
      });
      hasSavedRef.current = false;
    }
  }, [open, defalutValues, form]);

  const watchVariableName = form.watch("variableName") || "myDiscord";

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
            Discord Configuration
            {isSavingRef.current && (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            )}
            {hasSavedRef.current && !isSavingRef.current && (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Configure the Discord webhook setting for this node. Changes are
            saved automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8 mt-4">
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myDiscord" {...field} />
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
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://discord.com/api/webhooks/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Get this from Discord: Channel Settings → Integrations →
                    Webhooks
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summary: {{myGemini.text}}"
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The message to send. Use {"{{variables}}"} for simple values
                    or {"{{json variable}}"} to stringify objects.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Username (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Workflow Bot" {...field} />
                  </FormControl>
                  <FormDescription>
                    Override the webhook's default username.
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
