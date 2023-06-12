import { User } from '../types/custom';
import { http } from '../utils/http';
import { IDataResolverService } from './interfaces/data-resolver-service.interface';

/*
  Interacts with existing REST-API services
*/
export class CobDataResolverService<T extends object> implements IDataResolverService<T> {
  constructor(private readonly user?: User) { }

  async getData(url: string): Promise<T> {
    return Promise.resolve({} as T);
    /*try {
      const resp = await http.get(url);
      if (resp) {
        if (resp.data) {
          return Promise.resolve(resp.data as T);
        }
      }
      return Promise.resolve({} as T);
    } catch (error: any) {
      //error.message ??= 'Unknown error message';
      return Promise.reject(error);
    }*/
  }

  async getDataArray(url: string): Promise<T[]> {
    // extra headers are needed for calling REST-API services and not MRA-DL
    let config: any = {
      headers: {
        'rest-user': 'edi-gw', 
        'rest-uid': this.user? this.user.personId : "edi-gw", 
        'rest-ts': new Date()
      }
    };

    try {
      const resp = await http.get(url, config);
      //console.log(resp);
      if (resp) {
        if (resp.data) {
          return Promise.resolve(resp.data as T[]);
        }
      }
      return Promise.resolve([]);
    } catch (error: any) {
      return Promise.reject(error);
    }
  }

  async postData(url: string, data?: any): Promise<T> {
    // extra headers are needed for calling REST-API services and not MRA-DL
    let config: any = {
      headers: {
        'rest-user': 'edi-gw', 
        'rest-uid': this.user? this.user.personId : "edi-gw", 
        'rest-ts': new Date()
      }
    };

    //console.log(config);
    try {
      const resp = await http.post(url, data, config);
      //console.log(resp);
      if (resp) {
        if (resp.data) {
          return Promise.resolve(resp.data as T);
        }
      }
      return Promise.resolve({} as T);
    } catch (error: any) {
      //error.message ??= 'Unknown error message';
      return Promise.reject(error);
    }
  }
}
