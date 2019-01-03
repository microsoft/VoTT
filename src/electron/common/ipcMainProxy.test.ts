import { BrowserWindow, IpcMain } from "electron";
import fs from "fs";
import path from "path";
import LocalFileSystem from "../providers/storage/localFileSystem";
import { IpcMainProxy } from "./ipcMainProxy";

describe("IpcMainProxy", () => {
    let proxy: IpcMainProxy = null;

    beforeEach(() => {
        const ipcMainMock = {} as IpcMain;
        ipcMainMock.on = jest.fn();
        const browserWindowMock = {} as BrowserWindow;

        proxy = new IpcMainProxy(ipcMainMock, browserWindowMock);
    });

    it("is defined", () => {
        expect(proxy).toBeDefined();
        expect(proxy).not.toBeNull();
    });

    it("registers a command handler for a single command", () => {
        const commandName = "COMMAND_ONE";
        proxy.register(commandName, jest.fn());

        expect(proxy.handlers[commandName]).toBeDefined();
        expect(proxy.handlers[commandName]).not.toBeNull();
    });

    it("registers a suite of commands for a whole object", () => {
        const localFileSystem = new LocalFileSystem(null);
        proxy.registerProxy("LocalFileSystem", localFileSystem);

        expect(Object.keys(proxy.handlers).length).toBeGreaterThan(0);
    });

    it("calls the methods correctly", async () => {
        const localFileSystem = new LocalFileSystem(null);
        proxy.registerProxy("LocalFileSystem", localFileSystem);

        const handler = proxy.handlers["LocalFileSystem:writeText"];
        const filePath = path.join(__dirname, "test.json");
        const args = [filePath, "test"];
        await handler(null, args);

        expect(fs.existsSync(filePath)).toBeTruthy();

        fs.unlinkSync(filePath);
    });
});
