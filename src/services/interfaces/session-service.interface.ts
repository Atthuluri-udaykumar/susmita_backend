
import { EdiSession } from "../../models/edi-session.model";


export interface ISessionService {
    getSession(): Promise<EdiSession>;
    updateSession( session: EdiSession): Promise<void>;
}