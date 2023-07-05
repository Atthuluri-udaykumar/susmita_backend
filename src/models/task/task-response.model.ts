export class TaskResponse {
  trackingId: string;
  status = 200;
  errors: any[];
  result: any | undefined;

  constructor(trackingId?: any) {
    this.errors = [];
    this.trackingId = trackingId? trackingId: '';
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
