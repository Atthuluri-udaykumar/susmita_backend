import { User } from "../../types/custom";

export interface IEcrsService {
     getContractorData(user: User, contractorNo: string): Promise<any>;
     uploadContractorList(user: User, userId: string): Promise<any>;
}