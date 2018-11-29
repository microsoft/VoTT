export interface IpcProxyMessage<TResult> {
    id: string;
    type: string;
    args?: any;
    error?: string;
    result?: TResult;
    debug?: string;
}
