import { ServiceResponse } from '../models/serviceresponse.model';
import { User } from '../types/custom';
import { http } from '../utils/http';
import { IDataResolverService } from './interfaces/data-resolver-service.interface';

/*
  Used for accessing MRA-DL microservice endpoints
*/
export class MraDataResolverService<T extends object> implements IDataResolverService<T> {

  async getData(url: string): Promise<T> {
    return Promise.resolve({} as T);
    /*try {
      const resp = await http.get<ServiceResponse>(url);
      if (resp) {
        if (resp.data.result) {
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
    try {
      const resp = await http.get<ServiceResponse>(url);
      //console.log(resp);
      if (resp) {
        if (resp.data.result) {
          return Promise.resolve(resp.data.result as T[]);
        }
      }
      return Promise.resolve([]);
    } catch (error: any) {
      return Promise.reject(error);
    }
  }

  async postData(url: string, data?: any): Promise<T> {
    return Promise.resolve({} as T);
    /*try {
      const resp = await http.post<ServiceResponse>(url, data);
      //console.log(resp);
      if (resp) {
        if (resp.data.result) {
          return Promise.resolve(resp.data.result as T);
        }
      }
      return Promise.resolve({} as T);
    } catch (error: any) {
      //error.message ??= 'Unknown error message';
      return Promise.reject(error);
    }*/
  }

  async putData(url: string, data?: any): Promise<T> {
    try {
      const resp = await http.put<any, ServiceResponse>(url, data);
      //console.log(resp);
      if (resp?.data?.result) {
          return Promise.resolve(resp.data.result as T);
      }
      return Promise.resolve({} as T);
    } catch (error: any) {
      //error.message ??= 'Unknown error message';
      return Promise.reject(error);
    }
  }  
}
