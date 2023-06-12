import { Login } from "../../models/Login";

export interface IAuthenticationRepository {

    authenticate( username: string, password: string): Promise<Login>;

}