import { Connection, Node } from "@prisma/client";
import toposort from "toposort";
import { inngest } from "./client";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[]
): Node[] => {
  // If no connections, return node as-s (they're all indpendent)
  if (connections.length === 0) {
    return nodes;
  }

  //create edges array for transort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  //Add nodes with no connections as self-edges to ensure they're included
  const connectionNodeIds = new Set<string>();
  for (const conn of connections) {
    connectionNodeIds.add(conn.fromNodeId);
    connectionNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectionNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  //Perform topological sort;
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    //remove dublicate (from self-edges)
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle");
    }
    throw error;
  }

  //Map sorted iDs back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};



export const sendWorkflowExecution = async(data: {
  workflowId: string;
  [key: string]:any;
})=>{

  await inngest.send({
    name: "workflow/execute.workflow",
    data,
  })
}