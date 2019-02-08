export class ClipBoard<T> {

    private payload: T;

    constructor() {
        this.payload = null;
    }

    public get = () => {
        return this.payload;
    }

    public set = (payload: T) => {
        this.payload = payload;
    }

    public pop = () => {
        this.payload = null;
    }
} 