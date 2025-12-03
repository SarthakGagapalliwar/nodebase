
import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { NodeType } from "@prisma/client";
import { getExector } from "@/features/execution/lib/executor-registry";

export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow" },
  { event: "workflow/execute.workflow" },
  async ({ event, step }) => {

    const workflowId = event.data.workflowId;

    if(!workflowId){
      throw new NonRetriableError("Workflow ID is missing");
    }


    const sortedNodes =  await step.run("prepare-workflow", async()=>{
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {id: workflowId},
        include:{
          nodes: true,
          connections: true,
        }
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    //Initialize  context with any initial data from the trigger
    let context = event.data.initialData || {};

    //Execute each node
    for(const node of sortedNodes){
      const  executor = getExector(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
      });
      
    }

    return {
      workflowId,
      result: context,
    };
  }
);
