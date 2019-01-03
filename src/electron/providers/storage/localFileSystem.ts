import { BrowserWindow, dialog } from "electron";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import { IStorageProvider } from "../../../providers/storage/storageProvider";
import { IAsset, AssetType } from "../../../models/applicationState";
import { AssetService } from "../../../services/assetService";
import { strings } from "../../../common/strings";

export default class LocalFileSystem implements IStorageProvider {
    constructor(private browserWindow: BrowserWindow) { }

    public selectContainer(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const filePaths = dialog.showOpenDialog(this.browserWindow, {
                title: strings.connections.providers.local.selectFolder,
                buttonLabel: strings.connections.providers.local.chooseFolder,
                properties: ["openDirectory", "createDirectory"],
            });

            if (!filePaths || filePaths.length !== 1) {
                return reject();
            }

            resolve(filePaths[0]);
        });
    }

    public readText(filePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(filePath, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(data.toString());
            });
        });
    }

    public readBinary(filePath: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(filePath, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }

    public writeBinary(filePath: string, contents: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const containerName: fs.PathLike = path.dirname(filePath);
            const exists = fs.existsSync(containerName);
            if (!exists) {
                fs.mkdirSync(containerName);
            }

            fs.writeFile(filePath, contents, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    public writeText(filePath: string, contents: string): Promise<void> {
        const buffer = Buffer.alloc(contents.length, contents);
        return this.writeBinary(filePath, buffer);
    }

    public deleteFile(filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const exists = fs.existsSync(filePath);
            if (exists) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            }
        });
    }

    public listFiles(folderPath: string): Promise<string[]> {
        return this.listItems(folderPath, (stats) => !stats.isDirectory());
    }

    public listContainers(folderPath: string): Promise<string[]> {
        return this.listItems(folderPath, (stats) => stats.isDirectory());
    }

    public createContainer(folderPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.exists(folderPath, (exists) => {
                if (exists) {
                    resolve();
                } else {
                    fs.mkdir(folderPath, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                }
            });
        });
    }

    public deleteContainer(folderPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.exists(folderPath, (exists) => {
                if (exists) {
                    rimraf(folderPath, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    public async getAssets(folderPath?: string): Promise<IAsset[]> {
        return (await this.listFiles(folderPath))
            .map((filePath) => AssetService.createAssetFromFilePath(filePath))
            .filter((asset) => asset.type !== AssetType.Unknown);
    }

    /**
     * Gets a list of file system items matching the specified predicate within the folderPath
     * @param  {string} folderPath
     * @param  {(stats:fs.Stats)=>boolean} predicate
     * @returns {Promise} Resolved list of matching file system items
     */
    private listItems(folderPath: string, predicate: (stats: fs.Stats) => boolean) {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(folderPath, async (err: NodeJS.ErrnoException, fileSystemItems: string[]) => {
                if (err) {
                    return reject(err);
                }

                const getStatsTasks = fileSystemItems.map((name) => {
                    const filePath = path.join(folderPath, name);
                    return this.getStats(filePath);
                });

                try {
                    const statsResults = await Promise.all(getStatsTasks);
                    const filteredItems = statsResults
                        .filter((result) => predicate(result.stats))
                        .map((result) => result.path);

                    resolve(filteredItems);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets the node file system stats for the specified path
     * @param  {string} path
     * @returns {Promise} Resolved path and stats
     */
    private getStats(path: string): Promise<{ path: string, stats: fs.Stats }> {
        return new Promise((resolve, reject) => {
            fs.stat(path, (err, stats: fs.Stats) => {
                if (err) {
                    reject(err);
                }

                resolve({
                    path,
                    stats,
                });
            });
        });
    }
}
