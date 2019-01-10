import { ExportProviderFactory } from "./exportProviderFactory";
import { ExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";

describe("Export Provider Factory", () => {
    const testProject: IProject = {
        id: "1",
        name: "Test Project",
        autoSave: true,
        exportFormat: {
            providerType: "TestExportProvider",
            providerOptions: {},
        },
        sourceConnection: null,
        tags: [],
        targetConnection: null,
    };

    it("registers new export providers", () => {
        expect(Object.keys(ExportProviderFactory.providers).length).toEqual(0);
        ExportProviderFactory.register({
            name: "testProvider",
            displayName: "Test Provider",
            factory: (project) => new TestExportProvider(project),
        });
        expect(Object.keys(ExportProviderFactory.providers).length).toEqual(1);
        expect(ExportProviderFactory.providers["testProvider"].displayName).toEqual("Test Provider");
    });

    it("creates a new instance of the provider", () => {
        ExportProviderFactory.register({
            name: "testProvider",
            displayName: "Test Provider",
            factory: (project) => new TestExportProvider(project),
        });
        const provider = ExportProviderFactory.create(
            "testProvider",
            testProject,
            testProject.exportFormat.providerOptions,
        );

        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TestExportProvider);
    });

    it("throws error if provider is not found", () => {
        expect(() => ExportProviderFactory.create(
            "unknown",
            testProject,
            testProject.exportFormat.providerOptions,
        )).toThrowError();
    });
});

class TestExportProvider extends ExportProvider<{}> {
    public project: IProject;

    public export(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
