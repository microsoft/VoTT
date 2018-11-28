import fs from 'fs';
import path from 'path';
import { IStorageProvider } from '../../../providers/storage/storageProvider';
import { dialog, BrowserWindow } from 'electron';
import rimraf from 'rimraf';

export default class LocalFileSystem implements IStorageProvider {
    constructor(private browserWindow: BrowserWindow) { }

    selectContainer(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            dialog.showOpenDialog(this.browserWindow, {
                title: 'Select Folder',
                buttonLabel: 'Choose Folder',
                properties: ['openDirectory', 'createDirectory']
            },
                (filePaths) => {
                    if (!filePaths || filePaths.length !== 1) {
                        return reject();
                    }

                    resolve(filePaths[0]);
                });
        });
    }

    readText(filePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(filePath, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(data.toString());
            });
        });
    }

    readBinary(filePath: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(filePath, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        })
    }

    writeBinary(filePath: string, contents: Buffer): Promise<void> {
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
            })
        });
    }

    writeText(filePath: string, contents: string): Promise<void> {
        const buffer = Buffer.alloc(contents.length, contents);
        return this.writeBinary(filePath, buffer);
    }

    deleteFile(filePath: string): Promise<void> {
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

    listFiles(folderPath: string): Promise<string[]> {
        return this.listItems(folderPath, (stats) => !stats.isDirectory())
    }

    listContainers(folderPath: string): Promise<string[]> {
        return this.listItems(folderPath, (stats) => stats.isDirectory())
    }

    private listItems(folderPath: string, predicate: (stats: fs.Stats) => boolean) {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(folderPath, (err: NodeJS.ErrnoException, fileSystemItems: string[]) => {
                if (err) {
                    return reject(err);
                }

                const filteredItems: string[] = [];

                for (let i = 0; i < fileSystemItems.length; i++) {
                    const filePath = path.join(folderPath, fileSystemItems[i]);

                    fs.stat(filePath, (err, stats: fs.Stats) => {
                        if (err) {
                            return reject(err);
                        }

                        if (predicate(stats)) {
                            filteredItems.push(filePath);
                        }

                        // Resolve only after all items have been processed
                        if (i === fileSystemItems.length - 1) {
                            resolve(filteredItems);
                        }
                    });
                }
            });
        });
    }

    createContainer(folderPath: string): Promise<void> {
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
                    })
                }
            });
        });
    }

    deleteContainer(folderPath: string): Promise<void> {
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
}