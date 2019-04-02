import * as tfc from "@tensorflow/tfjs-core";
import { LocalFileSystemProxy, ILocalFileSystemProxyOptions } from "../../providers/storage/localFileSystemProxy";

export class ElectronProxyHandler implements tfc.io.IOHandler {
    protected readonly provider: LocalFileSystemProxy;

    constructor(folderPath: string) {
        const options: ILocalFileSystemProxyOptions = {folderPath};
        this.provider = new LocalFileSystemProxy(options);
    }

    public async save(modelArtifacts: tfc.io.ModelArtifacts): Promise<tfc.io.SaveResult> {
        // Save method not implemented - call must fail
        throw new Error(
            "Save Method not implemented");
    }

    public async load(): Promise<tfc.io.ModelArtifacts> {
        const modelJSON = JSON.parse(await this.provider.readText("/model.json"));

        const modelArtifacts: tfc.io.ModelArtifacts = {
            modelTopology: modelJSON.modelTopology,
        };

        if (modelJSON.weightsManifest != null) {
            const [weightSpecs, weightData] =
                await this.loadWeights(modelJSON.weightsManifest);
            modelArtifacts.weightSpecs = weightSpecs;
            modelArtifacts.weightData = weightData;
        }

        return modelArtifacts;
    }

    private async loadWeights(weightsManifest: tfc.io.WeightsManifestConfig)
        : Promise<[tfc.io.WeightsManifestEntry[], ArrayBuffer]> {
        const buffers: Buffer[] = [];
        const weightSpecs: tfc.io.WeightsManifestEntry[] = [];

        for (const group of weightsManifest) {
            for (const shardName of group.paths) {
                const buffer = await this.provider.readBinary("/" + shardName);
                buffers.push(buffer);
            }
            weightSpecs.push(...group.weights);
        }

        return [weightSpecs, this.toArrayBuffer(buffers)];
    }

    /**
     * Convert a Buffer or an Array of Buffers to an ArrayBuffer.
     *
     * If the input is an Array of Buffers, they will be concatenated in the
     * specified order to form the output ArrayBuffer.
     */
    private toArrayBuffer(buf: Buffer|Buffer[]): ArrayBuffer {
        if (Array.isArray(buf)) {
            // An Array of Buffers.
            let totalLength = 0;
            for (const buffer of buf) {
                totalLength += buffer.length;
            }

            const ab = new ArrayBuffer(totalLength);
            const view = new Uint8Array(ab);
            let pos = 0;
            for (const buffer of buf) {
                pos += buffer.copy(view, pos);
            }
            return ab;
        } else {
            // A single Buffer. Return a copy of the underlying ArrayBuffer slice.
            return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        }
    }
}
