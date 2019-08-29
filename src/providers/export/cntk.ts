import os from "os";
import { ExportProvider, IExportResults } from "./exportProvider";
import { IAssetMetadata, IExportProviderOptions, IProject } from "../../models/applicationState";
import HtmlFileReader from "../../common/htmlFileReader";
import Guard from "../../common/guard";
import { splitTestAsset } from "./testAssetsSplitHelper";

enum ExportSplit {
    Test,
    Train,
}

/**
 * Export options for CNTK export provider
 */
export interface ICntkExportProviderOptions extends IExportProviderOptions {
    /** The test / train split ratio for exporting data */
    testTrainSplit?: number;
}

/**
 * CNTK Export provider
 */
export class CntkExportProvider extends ExportProvider<ICntkExportProviderOptions> {
    private exportFolderName: string;

    constructor(project: IProject, options: ICntkExportProviderOptions) {
        super(project, options);
        Guard.null(options);

        this.exportFolderName = `${this.project.name.replace(/\s/g, "-")}-CNTK-export`;
    }

    public async export(): Promise<IExportResults> {
        await this.createFolderStructure();
        const assetsToExport = await this.getAssetsForExport();
        const testAssets: string[] = [];

        const testSplit = (100 - (this.options.testTrainSplit || 80)) / 100;
        if (testSplit > 0 && testSplit <= 1) {
            const splittedAssets = splitTestAsset(assetsToExport, this.project.tags, testSplit);
            testAssets.push(...splittedAssets);
        }

        const results = await assetsToExport.mapAsync(async (assetMetadata) => {
            try {
                const exportSplit = testAssets.find((am) => am === assetMetadata.asset.id)
                    ? ExportSplit.Test
                    : ExportSplit.Train;

                await this.exportAssetFrame(assetMetadata, exportSplit);
                return {
                    asset: assetMetadata,
                    success: true,
                };
            } catch (e) {
                return {
                    asset: assetMetadata,
                    success: false,
                    error: e,
                };
            }
        });

        return {
            completed: results.filter((r) => r.success),
            errors: results.filter((r) => !r.success),
            count: results.length,
        };
    }

    private async exportAssetFrame(assetMetadata: IAssetMetadata, exportSplit: ExportSplit) {
        const labelData = [];
        const boundingBoxData = [];

        assetMetadata.regions.forEach((region) => {
            region.tags.forEach((tagName) => {
                labelData.push(tagName);
                // tslint:disable-next-line:max-line-length
                boundingBoxData.push(`${region.boundingBox.left}\t${region.boundingBox.left + region.boundingBox.width}\t${region.boundingBox.top}\t${region.boundingBox.top + region.boundingBox.height}`);
            });
        });

        const buffer = await HtmlFileReader.getAssetArray(assetMetadata.asset);
        const folderName = exportSplit === ExportSplit.Train ? "positive" : "testImages";
        const labelsPath = `${this.exportFolderName}/${folderName}/${assetMetadata.asset.name}.bboxes.labels.tsv`;
        const boundingBoxPath = `${this.exportFolderName}/${folderName}/${assetMetadata.asset.name}.bboxes.tsv`;
        const binaryPath = `${this.exportFolderName}/${folderName}/${assetMetadata.asset.name}`;

        await Promise.all([
            this.storageProvider.writeText(labelsPath, labelData.join(os.EOL)),
            this.storageProvider.writeText(boundingBoxPath, boundingBoxData.join(os.EOL)),
            this.storageProvider.writeBinary(binaryPath, Buffer.from(buffer)),
        ]);
    }

    private async createFolderStructure(): Promise<void> {
        const positiveFolder = `${this.exportFolderName}/positive`;
        const negativeFolder = `${this.exportFolderName}/negative`;
        const testImagesFolder = `${this.exportFolderName}/testImages`;

        await this.storageProvider.createContainer(this.exportFolderName);

        await [positiveFolder, negativeFolder, testImagesFolder]
            .forEachAsync(async (folderPath) => {
                await this.storageProvider.createContainer(folderPath);
            });
    }
}
