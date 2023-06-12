import { AccountActivity } from "../../models/account-activity.model";
import { AccountInfo } from "../../models/account-info.model";
import { AppType } from "../../models/apptypes.model";
import { User } from "../../types/custom";

export interface IAccountInfoService {
    findAccountByEIN(user: User, appType: AppType, ein: number | null): Promise<AccountInfo>;
    findAccountByAccountId(user: User, appType: AppType, accountId: number | null): Promise<AccountInfo>;
    findAccountBySSN(user: User, appType: AppType, ssn: number | null): Promise<AccountInfo>;

    fetchAccountActivity<T extends AccountActivity>(user: User, appType: AppType, accountId: number | null): Promise<T[]>;
    fetchPartiesData<T extends AccountActivity>(user: User, accountId: number | null): Promise<T[]>;
    submitAction(user: User, appType: AppType, submitterAction: AccountInfo): Promise<AccountInfo>;

}