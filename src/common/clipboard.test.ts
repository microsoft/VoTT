import Clipboard from "./clipboard";
import MockFactory from "./mockFactory";
import { IProject } from "../models/applicationState";
import { IAssetMetadata } from "vott-react";

describe("Clipboard tests", () => {

    const mockObject = MockFactory.createTestProject();

    beforeAll(() => {
        const clipboard = (navigator as any).clipboard;
        if (!(clipboard && clipboard.writeText && clipboard.readText)) {
            (navigator as any).clipboard = {
                writeText: jest.fn(() => Promise.resolve()),
                readText: jest.fn(() => Promise.resolve(JSON.stringify(mockObject))),
            };
        }
    });
    it("Writes text to the clipboard", async () => {
        const text = "test";
        await Clipboard.writeText(text);
        expect((navigator as any).clipboard.writeText).toBeCalledWith(text);
    });

    it("Writes object to the clipboard", async () => {
        await Clipboard.writeObject(mockObject);
        expect((navigator as any).clipboard.writeText).toBeCalledWith(JSON.stringify(mockObject));
    });

    it("Reads text from the clipboard", async () => {
        expect(await Clipboard.readText()).toEqual(JSON.stringify(mockObject));
    });

    it("Reads object from the clipboard", async () => {
        expect(await Clipboard.readObject()).toEqual(mockObject);
    });
});
