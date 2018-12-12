import { reducer } from "./connectionsReducer";
import * as ActionTypes from "../actions/actionTypes";
import { IConnection } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

describe("Connections Reducer", () => {
    it("Load Connections returns new array of connections", () => {
        const state: IConnection[] = null;
        const testConnections = MockFactory.createTestConnections();
        const action = {
            type: ActionTypes.LOAD_CONNECTIONS_SUCCESS,
            connections: testConnections,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result).toEqual(testConnections);
    });

    it("Save Connection with new connection appends to list", () => {
        const testConnections = MockFactory.createTestConnections();
        const state: IConnection[] = testConnections;
        const newConnection = MockFactory.createTestConnection("11");
        const action = {
            type: ActionTypes.SAVE_CONNECTION_SUCCESS,
            connection: newConnection,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.length).toEqual(testConnections.length + 1);
    });

    it("Save Connection with existing connection updates list", () => {
        const testConnections = MockFactory.createTestConnections();
        const state: IConnection[] = testConnections;
        const updatedConnection = { ...testConnections[0] };
        const action = {
            type: ActionTypes.SAVE_CONNECTION_SUCCESS,
            connection: updatedConnection,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.length).toEqual(testConnections.length);
        expect(testConnections[0]).toEqual(result[0]);
    });

    it("Delete Connection removes specified connection from list", () => {
        const testConnections = MockFactory.createTestConnections();
        const state: IConnection[] = testConnections;
        const deletedConnection = { ...testConnections[0] };
        const action = {
            type: ActionTypes.DELETE_CONNECTION_SUCCESS,
            connection: deletedConnection,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.length).toEqual(testConnections.length - 1);
    });

    it("Load Project with new connection appends connection to list", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        testProject.sourceConnection = MockFactory.createTestConnection("1");
        testProject.targetConnection = MockFactory.createTestConnection("2");

        const state: IConnection[] = [];

        const action = {
            type: ActionTypes.LOAD_PROJECT_SUCCESS,
            project: testProject,
        };

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

        const action = {
            type: ActionTypes.LOAD_PROJECT_SUCCESS,
            project: testProject,
        };

        const result = reducer(state, action);
        expect(result.length).toEqual(testConnections.length);
        expect(result[0]).toEqual(testProject.sourceConnection);
        expect(result[1]).toEqual(testProject.targetConnection);
    });

    it("Unknown action performs a noop", () => {
        const state: IConnection[] = MockFactory.createTestConnections();
        const action = {
            type: "UNKNOWN",
        };

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
