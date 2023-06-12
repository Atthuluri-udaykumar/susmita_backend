
import { User } from "../../types/custom";


export interface IAuthenticationService {
    authenticateUser(username: string, password: string): Promise<User>;
}