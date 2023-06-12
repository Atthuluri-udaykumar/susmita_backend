export interface ITask {
  preProcess(parentData?: any, parentRequestData?: any, processMany?: boolean): Promise<any>;
  process(parentResponse?: any, processMany?: boolean): Promise<any>;
  postProcess(taskResponse: any, parentData?: any, processMany?: boolean): Promise<any>;
}