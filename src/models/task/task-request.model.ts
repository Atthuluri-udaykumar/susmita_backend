/*
 Url: remote data service endpoint request url
 paramsMap: holds the ${param} key(s) that are to be replaced in the request url with the value from parent data object response's property/item-key
*/

export class TaskRequest{
  type: string;
  url: string;
  method: string;
  paramsMap: Map<string, string>;
  body: any|null;
  
  constructor( 
    url: string = '',
    paramsMap: Map<string, string> = new Map<string, string>(),
    type = 'REST', //default
    method = 'GET',//default
    body = {},
    reqHandler?: any//<T extends (...args: any) => any>
  ) {
    this.url = url;
    this.paramsMap = paramsMap;
    this.type = type;
    this.method = method;
    this.body = body;
  }

  isValid(): boolean {
    if (this.type === 'REST') {
      if(this.url && this.url.trim().length > 0) {
        if((this.method === 'GET') || (this.body)){
          return true;
        } 
      }
      return false;
    }

    return true;
  }

  gatherRequestDataPayload(): {}{
    return  { url: this.url,
              ...Object.fromEntries(this.paramsMap), 
              ...this.body
            } ;
  }

  
}
