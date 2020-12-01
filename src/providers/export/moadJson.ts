import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject, IExportProviderOptions, IAssetMetadata, IRegion, IAsset, RegionType, ISegment } from "../../models/applicationState";
import Guard from "../../common/guard";
import { constants } from "../../common/constants";
import HtmlFileReader from "../../common/htmlFileReader";

/**
 * MOAD Json Export Provider options
 */
export interface IMoadJsonExportProviderOptions extends IExportProviderOptions {
    /** Whether or not to include binary assets in target connection */
    includeLabelImages: boolean;
    exportIndividuals: boolean;
}

/**
 * @name - MOAD Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class MoadJsonExportProvider extends ExportProvider<IMoadJsonExportProviderOptions> {
    constructor(project: IProject, options: IMoadJsonExportProviderOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to VoTT JSON format
     */
    public async export(): Promise<void> {
        const results = await this.getAssetsForExport();

        if (this.options.includeLabelImages) {
            /*
            await results.forEachAsync(async (assetMetadata) => {
                const arrayBuffer = await HtmlFileReader.getAssetArray(assetMetadata.asset);
                const assetFilePath = `moad-json-export/${assetMetadata.asset.name}`;
                await this.storageProvider.writeBinary(assetFilePath, Buffer.from(arrayBuffer));
            });
            */
        }

        const exportObject = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id) as any;

        // We don't need these fields in the export JSON
        delete exportObject.sourceConnection;
        delete exportObject.metadataConnection;
        delete exportObject.targetConnection;
        delete exportObject.exportFormat;

        if (this.options.exportIndividuals){
            const assets = exportObject.assets;
            const keys: string[] = [];
            if (keys.length === 0) {
                for (let k in assets) keys.push(k);
            }
            const assetMetadata: IAssetMetadata[] = [];
            keys.map( (key) => {const d: any = assets[key]; assetMetadata.push(d as IAssetMetadata)});

            assetMetadata.forEach(async (item) => {
                if( item.regions && item.regions.length) {
                    const fileName = `moad-json-export/geometry/${item.asset.name.replace(/\s/g, "-")}_BBPG_data.json`;
                    await this.storageProvider.writeText(fileName, JSON.stringify(this.regions2BBPG(item.regions, item.asset), null, 4));
                }
                if( item.segments && item.segments.length) {
                    const fileName = `moad-json-export/segmentation/${item.asset.name.replace(/\s/g, "-")}_PS_data.json`;
                    await this.storageProvider.writeText(fileName, JSON.stringify(this.segments2PS(item.segments, item.asset), null, 4));
                }
            });
        }
        else{
            const fileName = `moad-json-export/${this.project.name.replace(/\s/g, "-")}${constants.exportFileExtension}`;
            await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
        }
    }

    private segments2PS(segments: ISegment[], asset: IAsset){
        return segments.map( (segment) => this.segment2PS(segment, asset));
    }

    private segment2PS(segment: ISegment, asset: IAsset){
        return { 
            id: segment.id,
            image_id: asset.id,
            category_id: segment.tag,
            segmentation_method_id: 0,
            superpixel : segment.superpixel,
            area: segment.area,
            bbox: segment.boundingBox,
            iscrowd: segment.iscrowd,
            risk: segment.risk,
        }
    }

    private regions2BBPG(regions: IRegion[], asset: IAsset){
        return regions.map( (region) => this.region2BBPG(region, asset));
    }

    private region2BBPG(region: IRegion, asset: IAsset) {
        return { 
            id: region.id,
            image_id: asset.id,
            category_id: region.tag,
            type: region.type === RegionType.Rectangle ? "boundingbox" : 
                    region.type === RegionType.Polygon ? "polygon" :
                    region.type === RegionType.Polyline ? "polyline" :
                    "etc",
            segmentation : region.points,
            properties : {},
            area: region.area,
            bbox: region.boundingBox,
            isobscured: region.isobscured,
            istruncated: region.istruncated,
            risk: region.risk,
        }
    }
}
