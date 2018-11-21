import shortid from 'shortid';
import { IProject } from "../store/applicationState";
import LocalFileSystemProxy from '../providers/storage/localFileSystem';

export interface IProjectService {
    get(id: string): Promise<IProject>;
    getList(): Promise<IProject[]>;
    save(project: IProject): Promise<IProject>;
    delete(project: IProject): Promise<void>;
}

export default class ProjectService implements IProjectService {
    get(id: string): Promise<IProject> {
        return new Promise<IProject>(async (resolve, reject) => {
            const allProjects = await this.getList();
            const filtered = allProjects.filter(project => project.id === id);
            if (filtered.length === 1) {
                resolve(filtered[0]);
            }

            reject({
                message: `No project found with id: '${id}'`
            });
        });
    }

    getList(): Promise<IProject[]> {
        return new Promise<IProject[]>((resolve, reject) => {
            const projectsJson = localStorage.getItem('projects');
            if (!projectsJson) {
                return resolve([]);
            }

            let projects: IProject[] = [];

            try {
                projects = JSON.parse(projectsJson);
            }
            catch (err) {
                console.warn('Error loading projects from local storage');
            }

            resolve(projects);
        });
    }

    save(project: IProject) {
        return new Promise<IProject>(async (resolve, reject) => {
            try {
                if (!project.id) {
                    project.id = shortid.generate();
                }

                const localFileSystem = new LocalFileSystemProxy();
                const path = `C:\\vott-projects\\${project.name}.json`;
                await localFileSystem.writeFile(path, JSON.stringify(project, null, 4));

                let allProjects = await this.getList();
                allProjects = [{ ...project }, ...allProjects.filter(prj => prj.id !== project.id)];
                localStorage.setItem('projects', JSON.stringify(allProjects));
                resolve(project);
            }
            catch (err) {
                resolve(err);
            }
        });
    }

    delete(project: IProject) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const localFileSystem = new LocalFileSystemProxy();
                const path = `C:\\vott-projects\\${project.name}.json`;
                await localFileSystem.deleteFile(path);

                let allProjects = await this.getList();
                allProjects = allProjects.filter(prj => prj.id !== project.id);
                localStorage.setItem('projects', JSON.stringify(allProjects));
                resolve();
            }
            catch (err) {
                resolve(err);
            }
        });
    }
}