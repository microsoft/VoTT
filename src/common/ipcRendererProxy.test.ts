import { IpcRendererProxy } from "./ipcRendererProxy";

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

        const electronMock = {
            ipcRenderer: {
                send: jest.fn(),
                on: jest.fn(),
            },
        };

        (window as any).require = jest.fn(() => electronMock);
        expect(Object.keys(IpcRendererProxy.pending).length).toEqual(0);

        IpcRendererProxy.send(commandName, args);

        expect(electronMock.ipcRenderer.send).toBeCalledWith("ipc-main-proxy", {
            id: expect.any(String),
            type: commandName,
            args,
        });

        expect(Object.keys(IpcRendererProxy.pending).length).toEqual(1);
    });
});
