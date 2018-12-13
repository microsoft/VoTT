import { reducer } from "./recentProjectsReducer";
import { IProject } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import { saveProjectAction, deleteProjectAction } from "../actions/projectActions";
import { saveConnectionAction } from "../actions/connectionActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Recent Projects Reducer", () => {
    it("Loading / Saving new project appends to the list", () => {
        const testProjects = MockFactory.createTestProjects();
        const state: IProject[] = testProjects;
        const newProject = MockFactory.createTestProject("11");

        const action = saveProjectAction(newProject);
        const result = reducer(state, action);
        expect(result.length).toEqual(testProjects.length + 1);
        expect(result[0]).toEqual(newProject);
    });

    it("Loading / Saving existing project updates the list", () => {
        const testProjects = MockFactory.createTestProjects();
        const state: IProject[] = testProjects;
        const udpatedProject = { ...testProjects[0] };

        const action = saveProjectAction(udpatedProject);
        const result = reducer(state, action);
        expect(result.length).toEqual(testProjects.length);
        expect(result[0]).toEqual(udpatedProject);
    });

    it("Deleting an existing project removes from the list", () => {
        const testProjects = MockFactory.createTestProjects();
        const state: IProject[] = testProjects;
        const deletedProject = { ...testProjects[0] };

        const action = deleteProjectAction(deletedProject);
        const result = reducer(state, action);
        expect(result.length).toEqual(testProjects.length - 1);
    });

    it("Saving a connection updates recent project with matching connection", () => {
        const testProjects = MockFactory.createTestProjects(2);
        const state: IProject[] = testProjects;

        const updatedConnection = { ...testProjects[0].sourceConnection };
        updatedConnection.name += "Updated";

        const action = saveConnectionAction(updatedConnection);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result[0].sourceConnection).toEqual(updatedConnection);
    });

    it("Unknown action performs a noop", () => {
        const state = MockFactory.createTestProjects();

        const action = anyOtherAction();
        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
