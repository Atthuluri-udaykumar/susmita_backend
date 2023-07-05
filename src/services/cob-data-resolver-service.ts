import { getCurrentUser } from '../middleware/current-user';
import { getTransactionId } from '../middleware/transaction-id';
import { User } from '../types/custom';
import { http } from '../utils/http';
import { IDataResolverService } from './interfaces/data-resolver-service.interface';

/*
  Interacts with existing REST-API services
*/
export class CobDataResolverService<T extends object> implements IDataResolverService<T> {
  constructor(private readonly user?: User) { }

  async getData(url: string): Promise<T> {
    // extra headers are needed for calling REST-API services and not MRA-DL
    let config: any = {
      headers: {
        'rest-user': getCurrentUser(), 
        'rest-uid': getTransactionId(), 
        'rest-ts': new Date(),
        'x-b3-traceid': getTransactionId()
      }
    };

    try {
      const resp = await http.get(url, config);
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

  async getDataArray(url: string): Promise<T[]> {
    // extra headers are needed for calling REST-API services and not MRA-DL
    let config: any = {
      headers: {
        'rest-user': getCurrentUser(), 
        'rest-uid': getTransactionId(), 
        'rest-ts': new Date(),
        'x-b3-traceid': getTransactionId()
      }
    };

    try {
      const resp = await http.get(url, config);
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
        'rest-user': getCurrentUser(), 
        'rest-uid': getTransactionId(), 
        'rest-ts': new Date(),
        'x-b3-traceid': getTransactionId()
      }
    };

    try {
      const resp = await http.post(url, data, config);
      if (resp) {
        if (resp.data) {
          return Promise.resolve(resp.data as T);
        }
      }
      return Promise.resolve({} as T);
    } catch (error: any) {
      return Promise.reject(error);
    }
  }
}
