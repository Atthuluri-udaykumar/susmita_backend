import { get, set} from 'express-http-context';


export function setCurrentUser( userName: string) {
    set("currentUser", userName);
}


export function getCurrentUser() {
    return get("currentUser");
}

