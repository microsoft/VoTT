import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { AnyAction, Store } from "redux";
import MockFactory from "../../../../common/mockFactory";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { IApplicationState, IProject, AppError, ErrorCode } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import createReduxStore from "../../../../redux/store/store";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm, { IConfirmProps } from "../../common/confirm/confirm";
import FilePicker, { IFilePickerProps } from "../../common/filePicker/filePicker";
import HomePage, { IHomePageProps, IHomePageState } from "./homePage";

jest.mock("../../common/cloudFilePicker/cloudFilePicker");
import { CloudFilePicker, ICloudFilePickerProps } from "../../common/cloudFilePicker/cloudFilePicker";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

jest.mock("../../../../services/importService");
import ImportService from "../../../../services/importService";
import { toast } from "react-toastify";
import registerMixins from "../../../../registerMixins";

describe("Homepage Component", () => {
    let store: Store<IApplicationState> = null;
    let props: IHomePageProps = null;
    let wrapper: ReactWrapper = null;
    let deleteProjectSpy: jest.SpyInstance = null;
    let closeProjectSpy: jest.SpyInstance = null;
    const recentProjects = MockFactory.createTestProjects(2);
    const storageProviderMock = {
        writeText: jest.fn((project) => Promise.resolve(project)),
        deleteFile: jest.fn(() => Promise.resolve()),
    };
    StorageProviderFactory.create = jest.fn(() => storageProviderMock);

    function createComponent(store, props: IHomePageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <HomePage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        registerMixins();
        toast.success = jest.fn(() => 2);
        toast.info = jest.fn(() => 2);
    });

    beforeEach(() => {
        const projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve(project));
        projectServiceMock.prototype.delete = jest.fn(() => Promise.resolve());

        store = createStore(recentProjects);
        props = createProps();
        deleteProjectSpy = jest.spyOn(props.actions, "deleteProject");
        closeProjectSpy = jest.spyOn(props.actions, "closeProject");

        wrapper = createComponent(store, props);
    });

    it("should render a New Project Link", () => {
        expect(wrapper.find("a.new-project").exists()).toBe(true);
    });

    it("should not close projects when homepage loads", () => {
        expect(closeProjectSpy).not.toBeCalled();
    });

    it("should call upload when 'Open Project' is clicked", () => {
        const fileUpload = wrapper.find("a.file-upload").first();
        const filePicker = wrapper.find(FilePicker);
        const spy = jest.spyOn(filePicker.instance() as FilePicker, "upload");
        fileUpload.simulate("click");
        expect(spy).toBeCalled();
    });

    it("should show an error if the uploaded file is invalid", () => {
        const genericError = new Error("Error parsing project file JSON");
        const expectedError = new AppError(ErrorCode.ProjectUploadError, "Error uploading project file");
        const filePicker = wrapper.find(FilePicker) as ReactWrapper<IFilePickerProps>;

        expect(() => filePicker.props().onError(null, genericError)).toThrowError(expectedError);
    });

    it("should render a file picker", () => {
        expect(wrapper).not.toBeNull();
        expect(wrapper.find(FilePicker).exists()).toBeTruthy();
    });

    it("should render a list of recent projects", () => {
        expect(wrapper).not.toBeNull();
        const homePage = wrapper.find(HomePage).childAt(0) as ReactWrapper<IHomePageProps>;
        if (homePage.props().recentProjects && homePage.props().recentProjects.length > 0) {
            expect(wrapper.find(CondensedList).exists()).toBeTruthy();
        }
    });

    it("should delete a project when clicking trash icon", async () => {
        const store = createStore(recentProjects);
        const props = createProps();
        const wrapper = createComponent(store, props);

        expect(wrapper.find(".recent-project-item").length).toEqual(recentProjects.length);
        wrapper.find(".delete-btn").first().simulate("click");

        // Accept the modal delete warning
        wrapper.find(".modal-footer button").first().simulate("click");

        await MockFactory.flushUi();
        wrapper.update();

        const homePage = wrapper.find(HomePage).childAt(0) as ReactWrapper<IHomePageProps>;

        expect(deleteProjectSpy).toBeCalledWith(recentProjects[0]);
        expect(homePage.props().recentProjects.length).toEqual(recentProjects.length - 1);
        expect(toast.info).toBeCalledWith(expect.stringContaining(recentProjects[0].name));
    });

    it("should call convert project method if a v1 project is uploaded", async () => {
        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const importServiceMock = ImportService as jest.Mocked<typeof ImportService>;
        const projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1Project.jpg", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1Project.jpg";
        const testv1Project = MockFactory.createTestV1Project();
        const testv1ProjectJson = JSON.stringify(testv1Project);
        const testConnection = MockFactory.createTestConnection();
        const assets = MockFactory.createTestAssets(2);
        const testMetadata = assets.map((asset) => {
            return MockFactory.createTestAssetMetadata(asset);
        });
        const fileInfo = {
            content: testv1ProjectJson,
            file,
        };
        const convertedProject = {
            id: "aBC123",
            name: fileInfo.file.name.split(".")[0],
            version: "currentversion",
            securityToken: `${fileInfo.file.name.split(".")[0]} Token`,
            description: "Converted V1 Project",
            tags: [],
            sourceConnection: testConnection,
            targetConnection: testConnection,
            exportFormat: null,
            videoSettings: {
                frameExtractionRate: 15,
                tracking: false,
            },
            autoSave: true,
        };

        const convertProjectMock = importServiceMock.prototype.convertProject as jest.Mock;
        convertProjectMock.mockImplementationOnce(() => Promise.resolve(convertedProject));
        convertProjectMock.mockClear();

        const generateAssetsMock = importServiceMock.prototype.generateAssets as jest.Mock;
        generateAssetsMock.mockImplementationOnce(() => Promise.resolve(testMetadata));
        generateAssetsMock.mockClear();

        const saveMock = projectServiceMock.prototype.save as jest.Mock;
        saveMock.mockImplementation(() => Promise.resolve(convertedProject));
        saveMock.mockClear();

        const loadMock = projectServiceMock.prototype.load as jest.Mock;
        loadMock.mockImplementation(() => Promise.resolve(convertedProject));
        saveMock.mockClear();

        const wrapper = createComponent(store, props);

        await MockFactory.flushUi();
        const importConfirm = wrapper.find(Confirm).at(1) as ReactWrapper<IConfirmProps>;
        importConfirm.props().onConfirm(testv1Project);

        await MockFactory.flushUi();
        expect(convertProjectMock).toBeCalled();
        expect(generateAssetsMock).toBeCalled();
        expect(saveProjectSpy).toBeCalled();
        expect(loadProjectSpy).toBeCalled();
        expect(saveAssetMetadataSpy).toBeCalled();
    });

    it("should call open project action after successful file upload", async () => {
        const openProjectSpy = jest.spyOn(props.actions, "loadProject");

        const testProject = recentProjects[0];
        const testProjectJson = JSON.stringify(testProject);
        const testBlob = new Blob([testProjectJson], { type: "application/json" });

        const wrapper = createComponent(store, props);

        const fileUpload = wrapper.find("a.file-upload").first();
        const fileInput = wrapper.find(`input[type="file"]`);
        const filePicker = wrapper.find(FilePicker);
        const uploadSpy = jest.spyOn(filePicker.instance() as FilePicker, "upload");

        fileUpload.simulate("click");
        await MockFactory.flushUi(() => {
            fileInput.simulate("change", ({ target: { files: [testBlob] } }));
        });

        await MockFactory.flushUi();

        expect(uploadSpy).toBeCalled();
        expect(openProjectSpy).toBeCalledWith(testProject);
    });

    it("opens the cloud picker when selecting the open cloud project button", () => {
        const mockCloudFilePicker = CloudFilePicker as jest.Mocked<typeof CloudFilePicker>;

        wrapper.find("a.cloud-open-project").first().simulate("click");
        expect(mockCloudFilePicker.prototype.open).toBeCalled();
    });

    it("loads a cloud project after project file has been selected", () => {
        const openProjectSpy = jest.spyOn(props.actions, "loadProject");
        const testProject = MockFactory.createTestProject("TestProject");
        const projectJson = JSON.stringify(testProject, null, 4);
        const cloudFilePicker = wrapper.find(CloudFilePicker) as ReactWrapper<ICloudFilePickerProps>;
        cloudFilePicker.props().onSubmit(projectJson);

        expect(openProjectSpy).toBeCalledWith(testProject);
    });

    it("closes any open project and navigates to the new project screen", () => {
        const eventMock = {
            preventDefault: jest.fn(),
        };

        const homepage = wrapper.find(HomePage).childAt(0) as ReactWrapper<IHomePageProps, IHomePageState>;
        homepage.find("a.new-project").simulate("click", eventMock);
        expect(closeProjectSpy).toBeCalled();
        expect(homepage.props().history.push).toBeCalledWith("/projects/create");
        expect(eventMock.preventDefault).toBeCalled();
    });

    function createProps(): IHomePageProps {
        return {
            recentProjects: [],
            project: MockFactory.createTestProject(),
            connections: MockFactory.createTestConnections(),
            history: {
                length: 0,
                action: null,
                location: null,
                push: jest.fn(),
                replace: jest.fn(),
                go: jest.fn(),
                goBack: jest.fn(),
                goForward: jest.fn(),
                block: jest.fn(),
                listen: jest.fn(),
                createHref: jest.fn(),
            },
            location: {
                hash: null,
                pathname: null,
                search: null,
                state: null,
            },
            actions: (projectActions as any) as IProjectActions,
            applicationActions: (applicationActions as any) as IApplicationActions,
            appSettings: {
                devToolsEnabled: false,
                securityTokens: [],
            },
            match: {
                params: {},
                isExact: true,
                path: `https://localhost:3000/`,
                url: `https://localhost:3000/`,
            },
        };
    }

    function createStore(recentProjects: IProject[]): Store<IApplicationState, AnyAction> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: MockFactory.appSettings(),
            connections: [],
            recentProjects,
            appError: null,
        };

        return createReduxStore(initialState);
    }
});
