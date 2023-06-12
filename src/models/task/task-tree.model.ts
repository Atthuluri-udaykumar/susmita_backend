import { Task } from './task.model';
import { TaskNode } from './task-node.model';
/*
  A TaskTree consists of TaskNode[s].
  A TaskNode consist of a single Task
  A Task is a self contained unit of work that returns either a Promise.resolve or Promise.reject

            [A]
          /    \
        /       \
     [B]         [C]
    /   \       / | \
  [D]   [E]  [F] [G] [H]
            /  \
          [I]  [J]

  TaskTree parsing uses Breadth-First [BFS] traversal algorithm without the use of recursion
    1st Level node:  process root-node [A] first
    2nd level nodes: nodes that are children of root-node: [B,C] get processed next in parallel
    3rd Level nodes: nodes [D,E] and [F,G,H] are processed in parallel if parent nodes [B,C] succeeded.
    4th level nodes: nodes [I,J] are processed in parallel only if their parent-node[F] succeeded

  Child TaskNode[s] have access to post-processing data from their parent-node.
  
  Uses Promise.allSettled for parallel processing of child nodes.

  When a TaskNode is visited during traversal, it goes through:
  preProcess  : can used for consuming parent-node data before Task is processed. Example: setting request params.
  process     : task associate to this node gets executed. Example: fetch data from rest-api.
  postProcess:  can be used for data scrubbing,mapping before it is passed on to its child-nodes if present.Example: mapping text 
                description using a code-id.

  Note: 
    The parsing process creates a Async Generator which allows calling function to iterate over all nodes as they become available 
    post processing.
    Child-nodes only get processed if the parent-node processing succeeded.
    There is no limit to how deep a tree can be albeit resource and memory constraints. 

*/
export class TaskTree<T extends Task> {
  rootNode: TaskNode<T>;

  constructor(rootNode: TaskNode<T>) {
    this.rootNode = rootNode;
  }

  /* Creates an async generator that lets the caller iterate over 
    all nodes from this tree after they have been processed */
  async *parse() {
    let rootFailure = false;
    let result = new Array(); 
    
    //Start with the root node
    const rootTaskNode = await this.processNode(this.rootNode);
    /*console.log({'processRootNode': '[' + rootTaskNode.task.key + '] ' + rootTaskNode.task.taskRequest.url, 
                      'response': rootTaskNode.task.taskResponse, 
                      //'hasData': rootTaskNode.task.taskResponse.hasData(),
                      //'hasError': rootTaskNode.task.taskResponse.hasError()
                    });*/
    if (rootTaskNode && rootTaskNode.task.taskResponse.hasError()) {
      if(this.rootNode.hasFailoverNode){
        result.push(rootTaskNode);
      } else {
        rootFailure = true;
        result.push(rootTaskNode);
      }
    } else {
      result.push(rootTaskNode);
    }

    //for the current node, process all its children concurrently
    while (!rootFailure && result.length) {
      yield* result;

      const subTaskPromises: Promise<any>[] = result
        .filter((node) => (!node.task.taskResponse.hasError() || (node.task.taskResponse.hasError() && node.hasFailoverNode)))
        .flatMap((node: TaskNode<T>) =>
          node.fetchChildren().map((child: TaskNode<T>) => {
            return this.processNode(child);
          }),
        );

      /* =============================================================================
        Algorithm: Breadth-first(BFS) Traversal to process all child-nodes in parallel
        Uses Promise.allSettled() instead of Promise.all() to handle node failures
      */
      result = (await Promise.allSettled(subTaskPromises)).map((rsp) => {
        if (rsp.status === 'fulfilled') return rsp.value;
        else return rsp.reason;
      });
    }

    if (rootFailure) yield* result;
  }

  //process the task associated with this node
  async processNode(node: TaskNode<T>) {
    return Promise.resolve(
      await 
      (await 
        (
          await node.preProcess()
        ).process()
      ).postProcess()
      );
  }
}