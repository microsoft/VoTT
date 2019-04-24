import { IAssetMetadata, ModelPathType, IActiveLearningSettings, AssetState } from "../models/applicationState";
import { ObjectDetection } from "../providers/activeLearning/objectDetection";
import Guard from "../common/guard";
import { isElectron } from "../common/hostProcess";
import { Env } from "../common/environment";

export class ActiveLearningService {
    private objectDetection: ObjectDetection;
    private modelLoaded: boolean = false;

    constructor(private settings: IActiveLearningSettings) {
        Guard.null(settings);
        this.objectDetection = new ObjectDetection();
    }

    public isModelLoaded() {
        return this.modelLoaded;
    }

    public async predictRegions(canvas: HTMLCanvasElement, assetMetadata: IAssetMetadata): Promise<IAssetMetadata> {
        Guard.null(canvas);
        Guard.null(assetMetadata);

        // If the canvas or asset are invalid return asset metadata
        if (!(canvas.width && canvas.height && assetMetadata.asset && assetMetadata.asset.size)) {
            return assetMetadata;
        }

        await this.ensureModelLoaded();

        const xRatio = assetMetadata.asset.size.width / canvas.width;
        const yRatio = assetMetadata.asset.size.height / canvas.height;
        const predictedRegions = await this.objectDetection.predictImage(
            canvas,
            this.settings.predictTag,
            xRatio,
            yRatio,
        );

        const updatedRegions = [...assetMetadata.regions];
        predictedRegions.forEach((prediction) => {
            const matchingRegion = updatedRegions.find((region) => {
                return region.boundingBox
                    && region.boundingBox.left === prediction.boundingBox.left
                    && region.boundingBox.top === prediction.boundingBox.top
                    && region.boundingBox.width === prediction.boundingBox.width
                    && region.boundingBox.height === prediction.boundingBox.height;
            });

            if (updatedRegions.length === 0 || !matchingRegion) {
                updatedRegions.push(prediction);
            }
        });

        return {
            ...assetMetadata,
            regions: updatedRegions,
            asset: {
                ...assetMetadata.asset,
                state: updatedRegions.length > 0 ? AssetState.Tagged : AssetState.Visited,
                predicted: true,
            },
        } as IAssetMetadata;
    }

    public async ensureModelLoaded(): Promise<void> {
        if (this.modelLoaded) {
            return Promise.resolve();
        }

        await this.loadModel();
        this.modelLoaded = true;
    }

    private async loadModel() {
        let modelPath = "";
        if (this.settings.modelPathType === ModelPathType.Coco) {
            if (isElectron()) {
                const appPath = this.getAppPath();

                if (Env.get() !== "production") {
                    modelPath = appPath + "/cocoSSDModel";
                } else {
                    modelPath = appPath + "/../../cocoSSDModel";
                }
            } else {
                modelPath = "https://vott.blob.core.windows.net/coco-ssd-model";
            }
        } else if (this.settings.modelPathType === ModelPathType.File) {
            if (isElectron()) {
                modelPath = this.settings.modelPath;
            }
        } else {
            modelPath = this.settings.modelUrl;
        }

        await this.objectDetection.load(modelPath);
    }

    private getAppPath = () => {
        const remote = (window as any).require("electron").remote as Electron.Remote;
        return remote.app.getAppPath();
    }
}
