export interface IDeferred<T> {
    resolve(result?: T): void;
    reject(err?: any): void;
    then(value: T): Promise<T>;
    catch(err: any): Promise<T>;
}

export class Deferred<T> implements IDeferred<T> {
    public promise: Promise<T>;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });

        this.then = this.promise.then.bind(this.promise);
        this.catch = this.promise.catch.bind(this.promise);
    }
    // tslint:disable-next-line
    public resolve = (result?: T) => { };
    // tslint:disable-next-line
    public reject = (err?: any) => { };
    public then = (value: T) => { throw new Error("Not implemented yet"); };
    public catch = (err: any) => { throw new Error("Not implemented yet"); };
}
