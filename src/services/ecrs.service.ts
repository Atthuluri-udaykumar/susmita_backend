import { injectable } from 'inversify';
import { User } from '../types/custom';
import { CobDataResolverService } from './cob-data-resolver-service';
import { ContractorData } from '../models/ecrs.model';
import { IEcrsService } from './interfaces/ecrs-service.interface';

@injectable()
export class EcrsService implements IEcrsService {


  public async getContractorData(user: User, contractorNo: string): Promise<any> {
    const dataResolver = new CobDataResolverService<ContractorData>();
    let reqURL = "/api/v1/parties/manage/cntr/user"
    try {
      let req = { contractorNo: contractorNo, actionCd: "I" };
      //call endpoint
      const contractorRes: any = await dataResolver.postData(reqURL, req);
      //handle response
      if (!contractorRes) {
        return Promise.reject({
          status: 200,
          error: 'getContractorData: Unknown error'
        });
      }
      return Promise.resolve(contractorRes);
    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }


  public async uploadContractorList(user: User, userId: string): Promise<any> {
    const dataResolver = new CobDataResolverService<ContractorData>();
    let reqURL = `/api/v1/parties/contractors/uploadContractorList?signedInUser=${userId}`
    try {
      //call endpoint
      const contractorRes: any = await dataResolver.getData(reqURL);
      //handle response
      if (!contractorRes) {
        return Promise.reject({
          status: 200,
          error: 'uploadContractorList: Unknown error'
        });
      }
      return Promise.resolve(contractorRes);
    } catch (error) {
      return Promise.reject({ status: 500, error: error });
    }
  }

}