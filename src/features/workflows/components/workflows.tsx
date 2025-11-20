"use client";

import { useUpgradeModel } from "@/hooks/use-upgrade-modal";
import {
  useCreateWorkflow,
  useSuspenseWorkflows,
} from "../hooks/use-workflows";
import { EntityContainer, EntityHeader, EntityPagination, EntitySearch } from "@/components/entity-components";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";

export const WorkflowsSearch = ()=>{

  const [params, setParams] = useWorkflowsParams();

  const {searchValue, onSearchChange} = useEntitySearch({
    params,
    setParams,
  });

  return (
    <EntitySearch
    value={searchValue}
    onChange={onSearchChange}
    placeholder="Search workflows"
    />
  )
}

export const WorkflowsList = () => {
  const workflows = useSuspenseWorkflows();

  return (
    <div className="flex-1 flex justify-center items-center">
      <p>{JSON.stringify(workflows.data, null, 2)}</p>
    </div>
  );
};

export const WorkFlowHeader = ({ disabled }: { disabled?: boolean }) => {
  const createWorkflow = useCreateWorkflow();
  const router = useRouter();
  const { handleError, modal } = useUpgradeModel();

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  return (
    <>
      {modal}
      <EntityHeader
        title="Workflow"
        description="Create and Manage your workflows"
        onNew={handleCreate}
        newButtonLabel="New workflow"
        disable={disabled}
        isCreating={createWorkflow.isPending}
      />
    </>
  );
};

export const WorkflowsPagination = () =>{
  const workflow = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowsParams();

  return(
    <EntityPagination
      disabled={workflow.isFetching}
      totalPages={workflow.data.totalPages}
      page={workflow.data.page}
      onPageChanges={(page) => setParams({...params,page})}
    />
  );
};



export const WorkFlowContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<WorkFlowHeader />}
      search={<WorkflowsSearch/>}
      pagination={<WorkflowsPagination/>}
    >
      {children}
    </EntityContainer>
  );
};
