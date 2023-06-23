export class AccountActivity {
  public activityId: string | null = null;
  public activityDescription: string | null = null;
}

export class ContractorData {
  public contractorNo: string | null = null;
  public userIdList: any[] | null = null;
  public actionCd: string | null = null;
  public loggedInUser: string | null = null;
  public responseCd: string | null = null
}
export class EdiAccountActivity extends AccountActivity {
  public activityDt: string | null = null;
  public actvUserId: string | null = null;
  public activityCd: string | null = null;
  public firstName: string | null = null;
  public lastName: string | null = null;
}
export class GhprpAccountActivity extends AccountActivity {
  public activityDate: string | null = null;
  public userId: string | null = null;
  public letterId: string | null = null;
  public caseId: string | null = null;
  public defenseType: string | null = null;
  public defenseTypeDesc: string | null = null;
}
