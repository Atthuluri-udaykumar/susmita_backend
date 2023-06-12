import { AxiosResponse } from 'axios';
import { ServiceException } from '../models/serviceexception.model';
import { ServiceResponse } from '../models/serviceresponse.model';

export function handleSuccess(value: any): ServiceResponse {
    return getServiceResponse(200, value, []);
}

export function handleError(status: any, value: any, errors: any): ServiceResponse {
    return getServiceResponse(status, value, errors);
}

export function addError(status: any, errors: any, value: any,  serviceResponse: ServiceResponse): ServiceResponse {
    if ( !serviceResponse) {
        serviceResponse = new ServiceResponse();
    }
    serviceResponse.status = status;
    if (Array.isArray(serviceResponse.errors)) {
        serviceResponse.errors.push(errors); // TODO THIS HAS TO BE MODIFIED TO INCLUDE Error in the next position
    } else {
        serviceResponse.errors = errors;
    }
    serviceResponse.result = value;
    serviceResponse.timestamp = new Date();
    return serviceResponse;
}
export function getServiceResponse(status: any, value: any, errors: any): ServiceResponse {
    const serviceResponse: ServiceResponse = new ServiceResponse();
    serviceResponse.status = status;
    serviceResponse.errors = errors;
    serviceResponse.result = value;
    serviceResponse.timestamp = new Date();
    return serviceResponse;
}

    /**
     * Converts axios response into standard ServiceResponse object
     * 
     * @param resp AxiosResponse from service
     * @returns ServiceResponse
     * @throws ServiceException when response status code is not 200
     *  or the service respons has no errors and no result
     */
    export function handleResponse( resp: AxiosResponse) : ServiceResponse {
        if( resp.status != 200 ) {
            // this respnse should have been received as an error and does not belong here
            throw new ServiceException( resp.status, resp.statusText);
        }

        return handleSuccess(resp.data.result);
    }
