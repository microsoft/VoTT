import { BrowserWindow, dialog } from "electron";
import { IActiveLearningProvider } from "../../../providers/activeLearning/activeLearningProxy";
import { strings } from "../../../common/strings";

export default class LocalFileSystem implements IActiveLearningProvider {
    constructor(private browserWindow: BrowserWindow) { }

    public testMethod(input: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve("Proxy: " + input);
        });
    }
}
