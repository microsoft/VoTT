export interface IKeyboardRegistrations {
    [key: string]: KeyboardEventHandler[];
}

export type KeyboardEventHandler = (evt?: KeyboardEvent) => void;

export class KeyboardRegistrationManager {
    private registrations: IKeyboardRegistrations = {};

    public addHandler(keyCode: string, handler: KeyboardEventHandler): () => void {
        let keyRegistrations: KeyboardEventHandler[] = this.registrations[keyCode];
        if (!keyRegistrations) {
            keyRegistrations = [];
            this.registrations[keyCode] = keyRegistrations;
        }

        keyRegistrations.push(handler);

        return () => {
            const index = keyRegistrations.findIndex((h) => h === handler);
            keyRegistrations.splice(index, 1);
        };
    }

    public getHandlers(keyCode: string) {
        const registrations = this.registrations[keyCode];
        return registrations ? [...registrations] : [];
    }
}
