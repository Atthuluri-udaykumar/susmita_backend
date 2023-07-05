import { PersonRolesInfo } from "../../models/account-info.model";
import { AppType } from "../../models/apptypes.model";
import { User } from "../../types/custom";

export interface IRemoveAccountService {
    removePersonAccountAndPerson(user: User, appType:AppType, accountId: number|null): Promise<any>;
}