export class TaskResponse {
  status = 200;
  errors: any[];
  result: any | undefined;

  constructor() {
    this.errors = [];
  }

  processingSuccess(): boolean {
    return this.status === 200 ? true : false;
  }

  hasData(): boolean {
    return (this.result && !this.hasError());
  }
  hasError(): boolean {
    return (this.errors && this.errors.length>0);
  }
}
