import getHostProcess, { HostProcessType } from "./hostProcess";

jest.mock("os");
import os from "os";

describe("Host Process", () => {
    let originalHostType: string = null;

    beforeAll(() => {
        originalHostType = process.env.HOST_TYPE;
        process.env.HOST_TYPE = "";
    });

    afterAll(() => {
        process.env.HOST_TYPE = originalHostType;
    });

    it("sets host process type to electron when running as electron", () => {
        // tslint:disable-next-line:max-line-length
        const expectedRelease = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) vott-react-typescript/0.1.0 Chrome/66.0.3359.181 Electron/3.0.13 Safari/537.36";
        const releaseMock = os.release as jest.Mock;
        releaseMock.mockImplementationOnce(() => expectedRelease);

        const hostProcess = getHostProcess();

        expect(hostProcess.type).toEqual(HostProcessType.Electron);
        expect(hostProcess.release).toEqual(expectedRelease.toLowerCase());
    });

    it("sets host process type to browser when not electron", () => {
        // tslint:disable-next-line:max-line-length
        const expectedRelease = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36";
        const releaseMock = os.release as jest.Mock;
        releaseMock.mockImplementationOnce(() => expectedRelease);

        const hostProcess = getHostProcess();

        expect(hostProcess.type).toEqual(HostProcessType.Browser);
        expect(hostProcess.release).toEqual(expectedRelease.toLowerCase());
    });
});
