import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { activeConfig } from "./axios.config";
import { ServiceResponse } from "../models/serviceresponse.model";

enum StatusCode {
    Unauthorized = 401,
    Forbidden = 403,
    TooManyRequests = 429,
    InternalServerError = 500,
  }

  
class Http {
    private instance: AxiosInstance | null = null;
  
    private get http(): AxiosInstance {
      return this.instance != null ? this.instance : this.initHttp();
    }
  
    initHttp() {
      const foo = axios.create( activeConfig);
  
      foo.interceptors.response.use(
        (response) => response,
        (error) => {
          return this.handleError(error);
        }
      );
  
      this.instance = foo;
      return foo;
    }
  
    request<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> {
      return this.http.request(config);
    }
  
    get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
      return this.http.get<T, R>(url, config);
    }
  
    post<D = any, T = D, R = AxiosResponse<T>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig
    ): Promise<R> {
      return this.http.post<T, R>(url, data, config);
    }
     
    put<D = any, T = D, R = AxiosResponse<T>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig
    ): Promise<R> {
      return this.http.put<T, R>(url, data, config);
    }
  
    delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
      return this.http.delete<T, R>(url, config);
    }
  
    // Handle global app errors
    // We can handle generic app errors depending on the status code
    private handleError(error: any) {
      // if error has response, and response is valid ServiceResponse, reject the Promise with service response.
      if( error.response?.data ) {
        const data = error.response.data;
        // does data have status, errors, result and timestamp - then it's ServiceResponse()
        if( data.status && data.errors && data.result && data.timestamp) {
          let sr = new ServiceResponse();
          sr = Object.assign(sr , data);
          return Promise.reject(sr);
        } else {
          // not a standard service response, might be from java REST end-point
          let sr = new ServiceResponse();
          sr.status = data.status || error.code;
          sr.errors = data;
          sr.result = error.code || data.status;
          return Promise.reject(sr);
        }
        
      }
      const { status } = error.code;
  
      switch (status) {
        case StatusCode.InternalServerError: {
          // Handle InternalServerError
          break;
        }
        case StatusCode.Forbidden: {
          // Handle Forbidden
          break;
        }
        case StatusCode.Unauthorized: {
          // Handle Unauthorized
          break;
        }
        case StatusCode.TooManyRequests: {
          // Handle TooManyRequests
          break;
        }
      }
  
      return Promise.reject(error);
    }
  }
  
  export const http = new Http();