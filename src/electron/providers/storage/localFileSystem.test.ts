import fs from "fs";
import path, { relative, sep } from "path";
import shortid from "shortid";
import LocalFileSystem from "./localFileSystem";
import mockFs from "mock-fs";
import { AssetService } from "../../../services/assetService";
import registerMixins from "../../../registerMixins";

jest.mock("electron", () => ({
    dialog: {
        showOpenDialog: jest.fn(),
    },
}));
import { dialog } from "electron";

registerMixins();

describe("LocalFileSystem Storage Provider", () => {
    let localFileSystem: LocalFileSystem = null;
    const sourcePath = path.join("path", "to", "my", "source");
    const sourceFilePaths = [
        path.join(sourcePath, "file1.jpg"),
        path.join(sourcePath, "file2.jpg"),
        path.join(sourcePath, "subDir1", "file3.jpg"),
        path.join(sourcePath, "subDir1", "file4.jpg"),
        path.join(sourcePath, "subDir2", "file5.jpg"),
        path.join(sourcePath, "subDir2", "file6.jpg"),
        path.join(sourcePath, "subDir2", "subSubDir2", "file7.jpg"),
        path.join(sourcePath, "subDir2", "subSubDir2", "file8.jpg"),
    ];

    beforeEach(() => {
        localFileSystem = new LocalFileSystem(null);
    });

    beforeAll(() => {
        mockFs({
            path: {
                to: {
                    my: {
                        source: {
                            "file1.jpg": "contents",
                            "file2.jpg": "contents",
                            "subDir1": {
                                "file3.jpg": "contents",
                                "file4.jpg": "contents",
                            },
                            "subDir2": {
                                "file5.jpg": "contents",
                                "file6.jpg": "contents",
                                "subSubDir2": {
                                    "file7.jpg": "contents",
                                    "file8.jpg": "contents",
                                },
                            },
                        },
                    },
                },
            },
        });
    });

    afterAll(() => {
        mockFs.restore();
    });

    it("writes, reads and deletes a file as text", async () => {
        const filePath = path.join(process.cwd(), "test-output", `${shortid.generate()}.json`);
        const contents = {
            a: 1,
            b: 2,
            c: 3,
            d: "한글 中國 にほんご",
        };

        await localFileSystem.writeText(filePath, JSON.stringify(contents, null, 4));
        expect(fs.existsSync(filePath)).toBeTruthy();

        const json = await localFileSystem.readText(filePath);
        const actual = JSON.parse(json);

        expect(contents).toEqual(actual);

        await localFileSystem.deleteFile(filePath);
        expect(fs.existsSync(filePath)).toBeFalsy();
    });

    it("writes and deletes a container", async () => {
        const folderPath = path.join(process.cwd(), "test-output", shortid.generate());

        await localFileSystem.createContainer(folderPath);
        expect(fs.existsSync(folderPath)).toBeTruthy();

        await localFileSystem.deleteContainer(folderPath);
        expect(fs.existsSync(folderPath)).toBeFalsy();
    });

    it("lists files & containers in a provider", async () => {
        const fileFolderCount = 4;
        const testPath = path.join(process.cwd(), "test-output", shortid.generate());
        await localFileSystem.createContainer(testPath);

        for (let i = 1; i <= fileFolderCount; i++) {
            const filePath = path.join(testPath, `file${i}.txt`);
            await localFileSystem.writeText(filePath, "foobar");

            const containerPath = path.join(testPath, `folder${i}`);
            await localFileSystem.createContainer(containerPath);
        }

        const files = await localFileSystem.listFiles(testPath);
        const folders = await localFileSystem.listContainers(testPath);

        expect(files.length).toEqual(fileFolderCount);
        expect(folders.length).toEqual(fileFolderCount);

        await localFileSystem.deleteContainer(testPath);
    });

    it("selectContainer opens a dialog and resolves with selected path", async () => {
        const expectedContainerPath = "/path/to/container";
        const mockMethod = dialog.showOpenDialog as jest.Mock;
        mockMethod.mockReturnValue([expectedContainerPath]);

        const result = await localFileSystem.selectContainer();
        expect(result).toEqual(expectedContainerPath);
    });

    it("selectContainer rejects when a folder path is not returned", async () => {
        const mockMethod = dialog.showOpenDialog as jest.Mock;
        mockMethod.mockReturnValue([]);

        await expect(localFileSystem.selectContainer()).rejects.not.toBeNull();
    });

    it("deleting file that doesn't exist resolves successfully", async () => {
        await expect(localFileSystem.deleteFile("/path/to/fake/file.txt")).resolves.not.toBeNull();
    });

    it("getAssets gets all files recursively using path relative to the source", async () => {
        AssetService.createAssetFromFilePath = jest.fn(() => []);
        await localFileSystem.getAssets(sourcePath, true);
        const calls: any[] = (AssetService.createAssetFromFilePath as any).mock.calls;
        expect(calls).toHaveLength(8);
        expect(calls).toEqual(sourceFilePaths.map((path) => [
            path, undefined, path.replace(`${sourcePath}${sep}`, ""),
        ]));
    });

    it("getAssets gets all files recursively using absolute path", async () => {
        AssetService.createAssetFromFilePath = jest.fn(() => []);
        await localFileSystem.getAssets(sourcePath, false);
        const calls: any[] = (AssetService.createAssetFromFilePath as any).mock.calls;
        expect(calls).toHaveLength(8);
        expect(calls).toEqual(sourceFilePaths.map((path) => [path, undefined, path]));
    });
});
