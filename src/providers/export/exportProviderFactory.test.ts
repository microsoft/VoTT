import { ExportProviderFactory } from "./exportProviderFactory";
import { ExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

describe("Export Provider Factory", () => {
    const testProject: IProject = MockFactory.createTestProject("TestProject");

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

    it("ensures default is correct", () => {
        expect(Object.keys(ExportProviderFactory.providers).length).toEqual(1);
        ExportProviderFactory.register({
            name: "testProvider2",
            displayName: "Second Test Provider",
            factory: (project) => new TestExportProvider(project),
        });
        ExportProviderFactory.register({
            name: "testProvider3",
            displayName: "Third Test Provider",
            factory: (project) => new TestExportProvider(project),
        });
        expect(Object.keys(ExportProviderFactory.providers).length).toEqual(3);
        expect(ExportProviderFactory.defaultProvider).not.toBeNull();
        expect(ExportProviderFactory.defaultProvider.name).toEqual("testProvider");
        expect(ExportProviderFactory.defaultProvider.displayName).toEqual("Test Provider");

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
