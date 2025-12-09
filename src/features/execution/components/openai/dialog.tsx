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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CredentialType } from "@prisma/client";
import {
  useCreateCredentialType,
  useFreeTrial,
} from "@/features/credentials/hooks/use-credentials";
import { OPENAI_MODELS, FREE_CREDENTIAL_ID } from "@/config/ai-models";
import { GiftIcon, CheckIcon, LoaderIcon } from "lucide-react";

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
  model: z.string().min(1, "Model is required"),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "User prompt is required"),
});

export type OpenaiFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: z.infer<typeof formSchema>) => void;
  defalutValues?: Partial<OpenaiFormValues>;
}

export const OpenAiDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defalutValues = {},
}: Props) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCreateCredentialType(CredentialType.OPENAI);
  const { data: trialData, isLoading: isLoadingTrial } = useFreeTrial();

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasSavedRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defalutValues.variableName || "",
      credentialId: defalutValues.credentialId || "",
      model: defalutValues.model || OPENAI_MODELS[0].id,
      systemPrompt: defalutValues.systemPrompt || "",
      userPrompt: defalutValues.userPrompt || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defalutValues.variableName || "",
        credentialId: defalutValues.credentialId || "",
        model: defalutValues.model || OPENAI_MODELS[0].id,
        systemPrompt: defalutValues.systemPrompt || "",
        userPrompt: defalutValues.userPrompt || "",
      });
      hasSavedRef.current = false;
    }
  }, [open, defalutValues, form]);

  const watchVariableName = form.watch("variableName") || "myOpenAi";
  const watchCredentialId = form.watch("credentialId");
  const isFreeTier = watchCredentialId === FREE_CREDENTIAL_ID;

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
            OpenAI Configuration
            {isSavingRef.current && (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            )}
            {hasSavedRef.current && !isSavingRef.current && (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Configure the AI model and prompts for this node. Changes are saved
            automatically.
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
                    <Input placeholder="myOpenAi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result in other nodes:{" "}
                    {`{{${watchVariableName}.text}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential</FormLabel>
                    <Select
                      disabled={isLoadingCredentials || isLoadingTrial}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a credential" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trialData?.isInTrial && (
                          <SelectItem value={FREE_CREDENTIAL_ID}>
                            <span className="flex items-center gap-2">
                              <GiftIcon className="size-4 text-green-500" />
                              Free Trial ({trialData.daysRemaining} days left)
                            </span>
                          </SelectItem>
                        )}
                        {(credentials ?? []).map((credential) => (
                          <SelectItem key={credential.id} value={credential.id}>
                            <span className="flex items-center gap-2">
                              <img
                                src="/logos/openai.svg"
                                alt="OpenAI"
                                className="size-4"
                              />
                              {credential.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isFreeTier
                        ? "Using free trial"
                        : "Choose the OpenAI credential to use for this node."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPENAI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select which OpenAI model to use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    The prompt to send to the AI. Use {"{{variables}}"}
                    for simple values or {"{{json variable}}"} to stringify
                    objects
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
