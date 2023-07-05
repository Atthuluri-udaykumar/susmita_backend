import { MirPrsn } from './mir-prsn.model';
import { Submitter } from './submitter.model';
import { ConditionalTaskProcessingStatus } from './task/conditional-task.model';

class Address {
  public streetLine1: string = '';
  public streetLine2: string = '';
  public city: string = '';
  public state: string = '';
  public zip: string = '';
}
export class PersonDetails {
  public jobTitle: string = '';
  public email: string = '';  
  public phone: string = '';
  public phoneExt: string = '';  
  public fax: string = '';
  public ssn: string = '';
  public firstName: string = '';
  public middleName: string = '';
  public lastName: string = '';
  public deleteIndicator?: string = '';
}
class ContactInfo {
  public accountId: number = 0;
  public name: string = '';
  public pin: string = '';
  public pinStatus: string = '';
  public ein: number = 0;
  public einLocked: string = '';
  public email: string = '';  
  public statusDescription: string = ''; 
  public address: Address = new Address();
}
class GoPaperlessInfo {
  public indicator?: string = '';
  public jobTitle?: string = '';
  public optInDate?: any = undefined;
  public optOutDate?: any = undefined;
  public emailAddress?: string = '';  
}

class DisplayInfo {
  public showGoPaperlessDetails: boolean = false;
  public showARInfo: boolean = true;
  public showAMInfo: boolean = true;
  public optionViewAccountActvity: boolean = true;
  public optionResendProfileReport: boolean = true;
  public optionRemoveSubmitter: boolean = true;
  public optionVetSubmitter: boolean = false;
  public optionGrantFullFunctions: boolean = false;
  public optionResetPin: boolean = false;
  public optionUnlockPin: boolean = false;
  public optionPaperlessEmails: boolean = false;
  public optionPaperlessParties: boolean = false;
}

class ActionInfo {
  public status: number = 200; 
  public errors: any[] = [];
  public txnLogs: any[] = [];
  public actionViewAccountActvity: boolean = false;
  public actionResendProfileReport: boolean = false;
  public actionRemoveSubmitter: boolean = false;
  public actionVetSubmitter: boolean = false;
  public actionGrantFullFunctions: boolean = false;
  public actionResetPin: boolean = false;
  public actionUnlockPin: boolean = false;
  public actionGoPaperlessParties: boolean = false;  
  public actionPaperlessEmails: boolean = false;
  public emailFromDateMMDDYYYY?: string|null = null;
  public emailToDateMMDDYYYY?: string|null = null;
}
export class AccountInfo {
  public submitterInfo: Submitter | undefined;
  public contactInfo: ContactInfo = new ContactInfo();
  public arPersonInfo: PersonDetails = new PersonDetails();
  public amPersonInfo: PersonDetails = new PersonDetails();
  public goPaperlessInfo: GoPaperlessInfo = new GoPaperlessInfo();

  public displayInfo: DisplayInfo = new DisplayInfo();
  public actionInfo: ActionInfo = new ActionInfo();
}

export interface AccountPersonRolesInfo { 
  acctId: number;
  aplctnName: string;
  associatedPersons: PersonRolesInfo[];
}
export interface PersonRolesInfo { 
  prsnId: number;
  deleteMrpRole?: boolean;
  deleteWcsRole?: boolean;
  deleteGhprpRole?: boolean;
  mrpAR?: boolean;
  ghprpAR?: boolean;
  wcsAR?: boolean;
  mraAR?: boolean;
  noPrsnAcctMra?: boolean;
  noPrsnAcctMrp?: boolean;
  noPrsnAcctWcs?: boolean;
  noPrsnAcctGhprp?: boolean;
  prsnInfo: MirPrsn;
}

export interface PersonRolesActionStatusDetails { 
  prsnId: number;
  taskActionStatuses: ConditionalTaskProcessingStatus[];
}


