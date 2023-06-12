import { PersonInfo } from "../../models/person-info.model";
import { User } from "../../types/custom";

export interface IPersonInfoService {
    find(user: User, emailId: string|null, loginId: string|null): Promise<PersonInfo>;
    update(user: User, personAction: PersonInfo): Promise<PersonInfo>;
}