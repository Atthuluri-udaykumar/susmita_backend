export class MirPrsn {
  static VLD_STUS_PENDING:number = 1;
  static VLD_STUS_ACTIVE:number = 2;
  static VLD_STUS_INACTIVE:number = 3;
  static VLD_STUS_LOCKED:number = 4;
  
  public prsnId:number|null = null;
  public prsn1stName = '';
  public prsnMdlInitlName = '';
  public prsnLastName = '';
  public birthDt: any = undefined;
  public jobTitleDesc = '';
  public emailAdr = '';
  public telNum = '';
  public faxNum = '';
  public line1Adr = '';
  public line2Adr = '';
  public cityName = '';
  public stateId = 0;
  public zip5Cd = '';
  public zipPlus4Cd = '';
  public loginId = '';
  public vldtnStusId: number|null = null;
  public ssn = '';
  public recAddTs: any = undefined;
  public recAddUserName = '';
  public recUpdtTs: any = undefined;
  public recUpdtUserName = '';
  public lastLoginTs: any = undefined;
  public wcsRoleId: number|null = null;
  public faildLoginCnt = 0;
  public faildLoginTs: any = undefined;
  public mrpRoleId: number|null = null;
  public ghpRoleId: number|null = null;
  public adSw = '';
  //not in db
  public vldtnStusDesc? = '';

  //Refer to EM-188 comments
  static getVldtnStusDesc(vldtnStusId: any): string {
    switch(vldtnStusId){
      case MirPrsn.VLD_STUS_PENDING: return 'PENDING'; 
      case MirPrsn.VLD_STUS_ACTIVE: return 'ACTIVE'; 
      case MirPrsn.VLD_STUS_INACTIVE: return 'INACTIVE'; 
      case MirPrsn.VLD_STUS_LOCKED: return 'LOCKED'; 
      default: return '';
    }
  }
}
