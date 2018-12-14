import { reducer } from "./connectionsReducer";
import { IConnection } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import { saveConnectionAction, deleteConnectionAction } from "../actions/connectionActions";
import { loadProjectAction } from "../actions/projectActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Connections Reducer", () => {
    it("Save Connection with new connection appends to list", () => {
        const testConnections = MockFactory.createTestConnections();
        const state: IConnection[] = testConnections;
        const newConnection = MockFactory.createTestConnection("11");
        const action = saveConnectionAction(newConnection);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.length).toEqual(testConnections.length + 1);
    });

    it("Save Connection with existing connection updates list", () => {
        const testConnections = MockFactory.createTestConnections();
        const state: IConnection[] = testConnections;
        const updatedConnection = { ...testConnections[0] };
        const action = saveConnectionAction(updatedConnection);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.length).toEqual(testConnections.length);
        expect(testConnections[0]).toEqual(result[0]);
    });

    it("Delete Connection removes specified connection from list", () => {
        const testConnections = MockFactory.createTestConnections();
        const state: IConnection[] = testConnections;
        const deletedConnection = { ...testConnections[0] };
        const action = deleteConnectionAction(deletedConnection);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.length).toEqual(testConnections.length - 1);
    });

    it("Load Project with new connection appends connection to list", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        testProject.sourceConnection = MockFactory.createTestConnection("1");
        testProject.targetConnection = MockFactory.createTestConnection("2");

        const state: IConnection[] = [];

        const action = loadProjectAction(testProject);
        const result = reducer(state, action);
        expect(result.length).toEqual(2);
        expect(result[0]).toEqual(testProject.sourceConnection);
        expect(result[1]).toEqual(testProject.targetConnection);
    });

    it("Load project with existing connection updates connection list", () => {
        const testConnections = MockFactory.createTestConnections();
        const testProject = MockFactory.createTestProject("Test");
        testProject.sourceConnection = { ...testConnections[0] };
        testProject.sourceConnection.name += " Updated";
        testProject.targetConnection = { ...testConnections[1] };
        testProject.targetConnection.name += " Updated";

        const state: IConnection[] = testConnections;
        const action = loadProjectAction(testProject);
        const result = reducer(state, action);
        expect(result.length).toEqual(testConnections.length);
        expect(result[0]).toEqual(testProject.sourceConnection);
        expect(result[1]).toEqual(testProject.targetConnection);
    });

    it("Unknown action performs a noop", () => {
        const state: IConnection[] = MockFactory.createTestConnections();
        const action = anyOtherAction();

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
