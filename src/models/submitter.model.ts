import { DataFormatUtils } from "../utils/data-format.utils";

/*
   A DTO for the WCSBMTTR table
 */
export class Submitter {
  public  id = 0; // a.k.a account-id
  public  name:string = '';

  public  role?:string = '';
  public  status:string = '';
  public  type? :string = '';
  public  subType? :string = '';
  public  systemInd? :string = '';
  public  systemIndicator?:string = '';//used by IdProofing
    
  public  addr1? :string = '';
  public  addr2? :string = '';
  public  city? :string = '';
  public  state? :string = '';
  public  zip? :string = '';
  public  pin? :string = '';
  public  ein? :number|null = null;
  
  public  arFname? :string = '';
  public  arLname? :string = '';
  public  arMinit? :string = '';
  public  arSsn? :string = '';
  public  arTitle? :string = '';
  public  arEmail? :string = '';
  public  arPhone? :string = '';
  public  arExt? :string = '';
  public  arFax? :string = '';

  public  regDt? :string = '';
  public  mailDt? :string = '';
  public  valdInd? :string = '';
  public  updtOper? :string = '';
  public  updtDt? :string = '';
  
  public  partyId? :string = '';
  public  partyType? :string = '';

  public  amEmail? :string = '';
  
  public  paperlessInd? :string = '';	
  public  paperlessEmail? :string = '';	
  public  paperlessCcAd? :boolean = false;
  public  paperlessIndicator? :boolean = false;
  
  //specific to WCS
  public  clmLname? :string = '';
  public  clmFinit? :string = '';
  public  clmHicn? :string = '';
  public  clmSsn? :string = '';
  public  clmDob? :string = '';
  public  clmGender? :string = '';

  //specific to GHPRP: necessary due to field name differences between Submitter and EdiGhprpSubmitter on REST Users service
  public sbmtrId? :number = 0;
  public sbmtrPin? :string = '';
  public sbmtrType? :string = '';
  public sbmtrStatus? :string = '';
  public corpName? :string = '';
  public mailAddr1? :string = '';
  public mailAddr2? :string = '';
  public mailCity? :string = '';
  public mailState? :string = '';
  public mailZip5? :string = '';
  public mailZip4? :string = '';
  public arFirstNm? :string = '';
  public arLastNm? :string = '';
  public arMidInit? :string = '';
  public  letterId? :string = '';
	public  letterType? :string = '';
	public  profileId? :string = '';
	public  ppnDueDate? :string = '';
	public  defnsCaseId? :string = '';
	public  demndDebtAmtDue? :string = '';
	public  flag? :string = '';

  // The following are not columns in the WCSBMTTR table.
  public  paperlessOptInDate? :string = '';	
  public  paperlessOptOutDate? :string = '';
  public  mfaStatus? :string = '';
  public  amPersonId? :number|null = null;
  public  arDelete? :string = '';

  //not in db
  public appName? = '';
  public roleName? = '';
  public acctStatusName? = '';
  public email? = this.arEmail;

  static getAppName(systemIndicator: any): string {
    switch(systemIndicator){
      case 'W': return 'WCS';
      case 'M': return 'MRP';
      case 'G': return 'CRCP';
      default: return 'Section 111 MRA';//default
    }
  }

  static getRoleName(role: any): string {
    switch(role){
      case 'AM': return 'Account Manager';
      case 'AD': return 'Designee';
      case 'AR': return 'Account Representative';
      default: return '';//default
    }
  }

  static getAcctStatusName(status: any, systemIndicator: any): string {
    switch(status){
      case 'A': return 'Active'; 
      case 'I': return 'Initial Setup'; 
      case 'S': return 'Setup'; 
      case 'M': return 'Mailed'; 
      case 'L': return 'Locked'; 
      case 'T': return 'Testing'; 
      case 'C': return 'Discontinued'; 
      case 'P': {
        if(systemIndicator && systemIndicator === 'S'){
          return 'Production'; 
        } else {
          return 'Pending'; 
        }
        
      }
      case 'D': 
      default:   return ''; 
    }
  }

  static getWcsStatusDescription(status: any, systemIndicator: any): string {
    switch(status){
      case 'A': return 'Active';
      case 'C': return 'Inactive'; 
      case 'D': return 'Deleted';
      case 'I': return 'Initial Registration'; 
      case 'L': return 'Locked'; 
      case 'M': return 'PIN Sent'; 
      case 'P': {
        if(systemIndicator && systemIndicator === 'S'){
          return 'Production'; 
        } else {
          return 'Pending'; 
        }
      }
      case 'S': return 'Account Setup'; 
      default:  return status; 
    }
  }

  static getPinStatus(status: any): string {
    return status === 'L'? 'Locked': 'Unlocked';
  }    

}