import { TaskRequest } from "./task-request.model";
import { ITask } from "./task.interface";

export interface ITaskNode {
  get task(): any;
  get parent(): any;
  get processMany(): boolean;
  get isFailoverNode(): boolean;
  get hasFailoverNode(): boolean;
  get failoverErrorCriteria(): string;

  addChild(child: ITaskNode): void;
  fetchChildren(): any[];
  allowFailover(): boolean;

  preProcess(): Promise<ITaskNode>;
  process(): Promise<ITaskNode>;
  postProcess(): Promise<ITaskNode>;
}