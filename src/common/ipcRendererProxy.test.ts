import { IpcRendererProxy } from "./ipcRendererProxy";
jest.mock("electron", () => ({
    ipcRenderer: {
        on: jest.fn(),
        send: jest.fn(),
    },
}));
import electron from "electron";

describe("IpcRendererProxy", () => {
    it("is defined", () => {
        expect(IpcRendererProxy).toBeDefined();
    });

    it("send method forwards request to electron ipcRenderer", () => {
        const commandName = "TEST_COMMAND";
        const args = {
            a: 1,
            b: 2,
        };

        expect(Object.keys(IpcRendererProxy.pending).length).toEqual(0);

        IpcRendererProxy.send(commandName, args);

        expect(electron.ipcRenderer.send).toBeCalledWith("ipc-main-proxy", {
            id: expect.any(String),
            type: commandName,
            args,
        });

        expect(Object.keys(IpcRendererProxy.pending).length).toEqual(1);
    });
});
