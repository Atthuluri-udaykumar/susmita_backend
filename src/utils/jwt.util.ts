import { sign } from "jsonwebtoken";
import { createTokenPayload } from "../models/token-payload";
import { User } from "../types/custom";
import { jwtKey } from "./app.config";

     
export function createTokens( user: User) : any {
    const access = createTokenPayload( 'access', user );
    const refresh = createTokenPayload( 'refresh', user);

    const accessToken = sign( Object.assign({}, access), jwtKey as string, { expiresIn: '1m'});
    const refreshToken = sign( Object.assign({}, refresh), jwtKey as string, { expiresIn: '1h'});
    return {  user: user, token: accessToken, refreshToken: refreshToken };
}

export function createTokensForUser( user: User): any  {
    return createTokens( user);
}