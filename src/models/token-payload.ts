import { User } from "../types/custom";

export class TokenPayload  {
    tokenType: string = '';
    user: User = {
      personId: 0,
      firstName: '',
      middleName: '',
      lastName: '',
      userName: '',
      email: '',
      loginTimeStamp: null,
      badPwdCount: 0,
      badPasswordTime: 0,
      lockoutTime: 0,
      pwdLastSet: 0,
      memberOf: [], 
      roleId: 0
    };
  }

export function createTokenPayload( type: string, user: User): TokenPayload {
    const payload = new TokenPayload();
    payload.tokenType = type;
    payload.user = user;
    return payload;
  }
