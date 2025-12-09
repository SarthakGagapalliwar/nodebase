"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CheckIcon, LoaderIcon, SaveIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  useSuspenseWorkflow,
  useUpdateWorkflow,
  useUpdateWorkflowName,
} from "@/features/workflows/hooks/use-workflows";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { editorAtom } from "../store/atoms";

const AUTO_SAVE_INTERVAL = 3000; // Check every 3 seconds

export const EditorSaveButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSnapshotRef = useRef<string | null>(null);

  const handleSave = useCallback(() => {
    if (!editor) {
      return;
    }

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    saveWorkflow.mutate(
      {
        id: workflowId,
        nodes,
        edges,
      },
      {
        onSuccess: () => {
          setLastSavedAt(new Date());
          // Update snapshot after successful save
          lastSnapshotRef.current = JSON.stringify({ nodes, edges });
        },
      }
    );
  }, [editor, workflowId, saveWorkflow]);

  // Auto-save by polling for changes
  useEffect(() => {
    if (!editor) return;

    // Initialize snapshot on first load
    const nodes = editor.getNodes();
    const edges = editor.getEdges();
    lastSnapshotRef.current = JSON.stringify({ nodes, edges });

    const intervalId = setInterval(() => {
      if (saveWorkflow.isPending) return;

      const currentNodes = editor.getNodes();
      const currentEdges = editor.getEdges();
      const currentSnapshot = JSON.stringify({
        nodes: currentNodes,
        edges: currentEdges,
      });

      // Only save if there are changes
      if (
        lastSnapshotRef.current &&
        currentSnapshot !== lastSnapshotRef.current
      ) {
        handleSave();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [editor, handleSave, saveWorkflow.isPending]);

  const renderIcon = () => {
    if (saveWorkflow.isPending) {
      return <LoaderIcon className="size-4 animate-spin" />;
    }
    if (lastSavedAt) {
      return <CheckIcon className="size-4" />;
    }
    return <SaveIcon className="size-4" />;
  };

  const renderText = () => {
    if (saveWorkflow.isPending) {
      return "Saving...";
    }
    if (lastSavedAt) {
      return "Saved";
    }
    return "Save";
  };

  return (
    <div className="ml-auto">
      <Button size="sm" onClick={handleSave} disabled={saveWorkflow.isPending}>
        {renderIcon()}
        {renderText()}
      </Button>
    </div>
  );
};
export const EditorNameInput = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflowName();

  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState(workflow.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workflow.name) {
      setName(workflow.name);
    }
  }, [workflow.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (name == workflow.name) {
      setEditing(false);
      return;
    }

    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        name,
      });
    } catch {
      setName(workflow.name);
    } finally {
      setEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(workflow.name);
      setEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        disabled={updateWorkflow.isPending}
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-auto min-w-[100px] px-2"
      />
    );
  }

  return (
    <BreadcrumbItem
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:text-foreground transition-colors"
    >
      {workflow.name}
    </BreadcrumbItem>
  );
};

export const EditorBreadcrumbs = ({ workflowId }: { workflowId: string }) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link prefetch href="/workflows">
              Workflows
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <EditorNameInput workflowId={workflowId} />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export const EditorHeader = ({ workflowId }: { workflowId: string }) => {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 border-b px-4
        bg-background"
    >
      <SidebarTrigger />
      <div className="flex flex-row items-center justify-between gap-x-4 w-full">
        <EditorBreadcrumbs workflowId={workflowId} />
        <EditorSaveButton workflowId={workflowId} />
      </div>
    </header>
  );
};
