export default class Clipboard {
    public static async writeText(text: string): Promise<void> {
        return (navigator as any).clipboard.writeText(text);
    }

    public static async writeObject(item: any): Promise<void> {
        return Clipboard.writeText(JSON.stringify(item));
    }

    public static async readText(): Promise<string> {
        return (navigator as any).clipboard.readText();
    }

    public static async readObject(): Promise<any> {
        return Clipboard.readText().then((text) => Promise.resolve(JSON.parse(text)));
    }
}
