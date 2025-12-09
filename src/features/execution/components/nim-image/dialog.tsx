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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AUTO_SAVE_DELAY = 1000;

const IMAGE_SIZES = [
  { width: 512, height: 512, label: "512x512" },
  { width: 768, height: 768, label: "768x768" },
  { width: 1024, height: 1024, label: "1024x1024" },
  { width: 1024, height: 768, label: "1024x768 (Landscape)" },
  { width: 768, height: 1024, label: "768x1024 (Portrait)" },
];

// Use strings for all fields since HTML inputs return strings
const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  prompt: z.string().min(1, "Prompt is required"),
  size: z.string().min(1, "Size is required"),
  cfgScale: z.string().optional(),
  steps: z.string().optional(),
  seed: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export type NimImageFormValues = {
  variableName: string;
  prompt: string;
  width: number;
  height: number;
  cfgScale?: number;
  steps?: number;
  seed?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: NimImageFormValues) => void;
  defalutValues?: Partial<NimImageFormValues>;
}

export const NimImageDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defalutValues = {},
}: Props) => {
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasSavedRef = useRef(false);

  const defaultSize =
    defalutValues.width && defalutValues.height
      ? `${defalutValues.width}x${defalutValues.height}`
      : "1024x1024";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defalutValues.variableName || "",
      prompt: defalutValues.prompt || "",
      size: defaultSize,
      cfgScale: defalutValues.cfgScale?.toString() ?? "3.5",
      steps: defalutValues.steps?.toString() ?? "50",
      seed: defalutValues.seed?.toString() ?? "0",
    },
  });

  useEffect(() => {
    if (open) {
      const size =
        defalutValues.width && defalutValues.height
          ? `${defalutValues.width}x${defalutValues.height}`
          : "1024x1024";
      form.reset({
        variableName: defalutValues.variableName || "",
        prompt: defalutValues.prompt || "",
        size,
        cfgScale: defalutValues.cfgScale?.toString() ?? "3.5",
        steps: defalutValues.steps?.toString() ?? "50",
        seed: defalutValues.seed?.toString() ?? "0",
      });
      hasSavedRef.current = false;
    }
  }, [open, defalutValues, form]);

  const watchVariableName = form.watch("variableName") || "myImage";

  const handleAutoSave = useCallback(
    async (values: FormValues) => {
      const isValid = await form.trigger();
      if (!isValid) return;

      isSavingRef.current = true;
      hasSavedRef.current = false;

      setTimeout(() => {
        const [width, height] = values.size.split("x").map(Number);
        onSubmit({
          variableName: values.variableName,
          prompt: values.prompt,
          width,
          height,
          cfgScale: values.cfgScale ? parseFloat(values.cfgScale) : undefined,
          steps: values.steps ? parseInt(values.steps, 10) : undefined,
          seed: values.seed ? parseInt(values.seed, 10) : undefined,
        });
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
        handleAutoSave(value as FormValues);
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
            NIM Image Configuration
            {isSavingRef.current && (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            )}
            {hasSavedRef.current && !isSavingRef.current && (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Configure the FLUX image generation settings. Changes are saved
            automatically.
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
                    <Input placeholder="myImage" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result in other nodes:{" "}
                    {`{{${watchVariableName}.imageUrl}}`} or{" "}
                    {`{{${watchVariableName}.imageBase64}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A beautiful sunset over mountains, photorealistic"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the image you want to generate. Use{" "}
                    {"{{variables}}"} to include dynamic content, e.g.,{" "}
                    {"{{myGemini.text}}"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Size</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IMAGE_SIZES.map((size) => (
                          <SelectItem
                            key={size.label}
                            value={`${size.width}x${size.height}`}
                          >
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Output image dimensions</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Steps</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="50"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of inference steps (1-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cfgScale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CFG Scale</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        step={0.5}
                        placeholder="3.5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      How closely to follow the prompt (1-20)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0 (random)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      For reproducible results, use the same seed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
