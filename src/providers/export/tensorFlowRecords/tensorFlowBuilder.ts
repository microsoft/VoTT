import { TFRecordsImageMessage, Features, Feature, FeatureList,
    BytesList, Int64List, FloatList } from "./tensorFlowRecordsProtoBuf_pb";
import { crc32c, maskCrc, getInt64Buffer, getInt32Buffer, textEncode } from "./tensorFlowHelpers";

/**
 * @name - TFRecords Builder Class
 * @description - Create a TFRecords object
 */
export class TFRecordsBuilder {
    /**
     * @records - An Array of TFRecord Buffer created with releaseTFRecord()
     * @description - Return a Buffer representation of a TFRecords object
     */
    public static releaseTFRecords(records: Buffer[]): Buffer {
        return Buffer.concat(records.map((record) => {
            const length = record.length;

            // Get TFRecords CRCs for TFRecords Header and Footer
            const bufferLength = getInt64Buffer(length);
            const bufferLengthMaskedCRC = getInt32Buffer(maskCrc(crc32c(bufferLength)));
            const bufferDataMaskedCRC = getInt32Buffer(maskCrc(crc32c(record)));

            // Concatenate all TFRecords Header, Data and Footer buffer
            return Buffer.concat([bufferLength,
                                  bufferLengthMaskedCRC,
                                  record,
                                  bufferDataMaskedCRC]);
        }));
    }

    private features: Features;

    constructor() {
        this.features = new Features();
    }

    /**
     * @key - Feature Key
     * @value - An Int64 value
     * @description - Add an Int64 feature
     */
    public addIntFeature(key: string, value: number) {
        this.addIntArrayFeature(key, [value]);
    }

    /**
     * @key - Feature Key
     * @value - A Float value
     * @description - Add a Float feature
     */
    public addFloatFeature(key: string, value: number) {
        this.addFloatArrayFeature(key, [value]);
    }

    /**
     * @key - Feature Key
     * @value - A String value
     * @description - Add a String feature
     */
    public addStringFeature(key: string, value: string) {
        this.addBinaryArrayFeature(key, [textEncode(value)]);
    }

    /**
     * @key - Feature Key
     * @value - A Uint8Array value
     * @description - Add an Uint8Array byte array feature
     */
    public addBinaryFeature(key: string, value: Uint8Array) {
        this.addBinaryArrayFeature(key, [value]);
    }

    /**
     * @key - Feature Key
     * @value - An Array of Int64 values
     * @description - Add an Array of Int64 values feature
     */
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

    /**
     * @key - Feature Key
     * @value - An Array of Float values
     * @description - Add an Array of Float values feature
     */
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

    /**
     * @key - Feature Key
     * @value - An Array of String values
     * @description - Add an Array of String values feature
     */
    public addStringArrayFeature(key: string, values: string[]) {
        this.addBinaryArrayFeature(key, values.map((value) => textEncode(value)));
    }

    /**
     * @key - Feature Key
     * @value - An Array of Uint8Array values
     * @description - Add an Array of Uint8Array byte array values feature
     */
    public addBinaryArrayFeature(key: string, values: Uint8Array[]) {
        const byteList = new BytesList();
        values.forEach((value) => {
            byteList.addValue(value);
        });

        const feature = new Feature();
        feature.setBytesList(byteList);

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    /**
     * @description - Return a Buffer representation of a single TFRecord
     */
    public releaseTFRecord(): Buffer {
        // Get Protocol Buffer TFRecords object with exported image features
        const imageMessage = new TFRecordsImageMessage();
        imageMessage.setContext(this.features);

        // Serialize Protocol Buffer in a buffer
        const bytes = imageMessage.serializeBinary();
        return new Buffer(bytes);
    }
}
