import { EdiSession } from "../../models/edi-session.model";

export interface ISessionRepository {

    getSession(loginId: string, applicationName: string ): Promise<EdiSession>;

    updateSession( loginId: string, applicationName: string, session: EdiSession): Promise<void>;
}