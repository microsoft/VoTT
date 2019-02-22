export class Clipboard {
    public static async writeText(text: string): Promise<void> {
        return (navigator as any).clipboard.writeText(item);
    }

    public static async readText(): Promise<string> {
        return (navigator as any).clipboard.readText();
    }
}