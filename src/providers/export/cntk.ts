import { ExportProvider, IExportResults } from "./exportProvider";
import { IAssetMetadata } from "../../models/applicationState";
import HtmlFileReader from "../../common/htmlFileReader";

/**
 * CNTK Export provider
 */
export class CntkExportProvider extends ExportProvider {
    public async export(): Promise<IExportResults> {
        await this.createFolderStructure();
        const assetsToExport = await this.getAssetsForExport();

        const results = await assetsToExport.mapAsync(async (assetMetadata) => {
            try {
                await this.exportAssetFrame(assetMetadata);
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

    private async exportAssetFrame(assetMetadata: IAssetMetadata) {
        const labelData = [];
        const boundingBoxData = [];

        assetMetadata.regions.forEach((region) => {
            region.tags.forEach((tagName) => {
                labelData.push(tagName);
                // tslint:disable-next-line:max-line-length
                boundingBoxData.push(`${region.boundingBox.left}\t${region.boundingBox.left + region.boundingBox.width}\t${region.boundingBox.top}\t${region.boundingBox.top + region.boundingBox.height}`);
            });
        });

        const exportFolderName = `${this.project.name.replace(/\s/g, "-")}-CNTK-export`;
        const labelsPath = `${exportFolderName}/positive/${assetMetadata.asset.name}.bboxes.labels.tsv`;
        const boundingBoxPath = `${exportFolderName}/positive/${assetMetadata.asset.name}.bboxes.tsv`;
        const binaryPath = `${exportFolderName}/testImages/${assetMetadata.asset.name}`;

        const buffer = await HtmlFileReader.getAssetArray(assetMetadata.asset);

        await Promise.all([
            this.storageProvider.writeText(labelsPath, labelData.join("\n")),
            this.storageProvider.writeText(boundingBoxPath, boundingBoxData.join("\n")),
            this.storageProvider.writeBinary(binaryPath, Buffer.from(buffer)),
        ]);
    }

    private async createFolderStructure(): Promise<void> {
        const exportFolderName = `${this.project.name.replace(/\s/g, "-")}-CNTK-export`;
        const positiveFolder = `${exportFolderName}/positive`;
        const negativeFolder = `${exportFolderName}/negative`;
        const testImagesFolder = `${exportFolderName}/testImages`;

        await this.storageProvider.createContainer(exportFolderName);

        await [positiveFolder, negativeFolder, testImagesFolder]
            .forEachAsync(async (folderPath) => {
                await this.storageProvider.createContainer(folderPath);
            });
    }
}
