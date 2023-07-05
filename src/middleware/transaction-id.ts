import { get, set} from 'express-http-context';


// const asyncLocalStorage = new AsyncLocalStorage();

export function setTransactionId( traceId: string) {
    set( "traceId", traceId);
}


export function getTransactionId() {
    return get("traceId");
}

