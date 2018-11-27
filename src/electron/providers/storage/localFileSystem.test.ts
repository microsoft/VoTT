import LocalFileSystem from './localFileSystem';
import path from 'path';
import fs from 'fs';

describe('LocalFileSystem Storage Provider', () => {
    const localFileSystem = new LocalFileSystem(null);

    it('writes and reads a file as text', async () => {
        const filePath = path.join(__dirname, 'test.json');
        const contents = {
            a: 1,
            b: 2,
            c: 3
        };

        await localFileSystem.writeText(filePath, JSON.stringify(contents, null, 4));
        expect(fs.existsSync(filePath)).toBeTruthy();

        const json = await localFileSystem.readText(filePath);
        const actual = JSON.parse(json);

        expect(contents).toEqual(actual);

        fs.unlinkSync(filePath);
    });

    it('writes and deletes a container', async () => {
        const folderPath = path.join(__dirname, 'test_folder');

        await localFileSystem.createContainer(folderPath);
        expect(fs.existsSync(folderPath)).toBeTruthy();

        await localFileSystem.deleteContainer(folderPath);
        expect(fs.existsSync(folderPath)).toBeFalsy();
    });

    it('lists files & containers in a provider', async () => {
        const fileFolderCount = 4;
        const testPath = path.join(__dirname, 'test_folder');
        await localFileSystem.createContainer(testPath);

        for (let i = 1; i <= fileFolderCount; i++) {
            const filePath = path.join(testPath, `file${i}.txt`);
            await localFileSystem.writeText(filePath, 'foobar');
            const containerPath = path.join(testPath, `folder${i}`);
            await localFileSystem.createContainer(containerPath); 
        }

        const files = await localFileSystem.listFiles(testPath);
        expect(files.length).toEqual(fileFolderCount);

        const folders = await localFileSystem.listContainers(testPath);
        expect(folders.length).toEqual(fileFolderCount);

        await localFileSystem.deleteContainer(testPath); 
    });
});