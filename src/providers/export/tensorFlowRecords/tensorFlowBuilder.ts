import { TFRecordsImageMessage, Features, Feature, FeatureList,
    BytesList, Int64List, FloatList } from "./tensorFlowRecordsProtoBuf_pb";
import { crc32c, maskCrc, getInt64Buffer, getInt32Buffer, textEncode } from "./tensorFlowHelpers";

/**
 * @name - TFRecords Builder Class
 * @description - Create a TFRecords object
 */
export class TFRecordsBuilder {
    private features: Features;

    constructor() {
        this.features = new Features();
    }

    public addIntFeature(key: string, value: number) {
        const intList = new Int64List();
        intList.addValue(value);

        const feature = new Feature();
        feature.setInt64List(intList);

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    public addIntArrayFeature(key: string, values: number[]) {
        const intList = new Int64List();
        values.forEach((value) => {
            intList.addValue(value);
        });

        const feature = new Feature();
        feature.setInt64List(intList);

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    public addFloatArrayFeature(key: string, values: number[]) {
        const floatList = new FloatList();
        values.forEach((value) => {
            floatList.addValue(value);
        });

        const feature = new Feature();
        feature.setFloatList(floatList);

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    public addStringFeature(key: string, value: string) {
        this.addBinaryArrayFeature(key, textEncode(value));
    }

    public addBinaryArrayFeature(key: string, value: Uint8Array) {
        const byteList = new BytesList();
        byteList.addValue(value);

        const feature = new Feature();
        feature.setBytesList(byteList);

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    public addStringArrayFeature(key: string, values: string[]) {
        const byteList = new BytesList();
        values.forEach((value) => {
            byteList.addValue(textEncode(value));
        });

        const feature = new Feature();
        feature.setBytesList(byteList);

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }
}
