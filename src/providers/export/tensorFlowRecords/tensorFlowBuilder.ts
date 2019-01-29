import { TFRecordsImageMessage, Features, Feature, FeatureList,
    BytesList, Int64List, FloatList } from "./tensorFlowRecordsProtoBuf_pb";
import { crc32c, maskCrc, getInt64Buffer, getInt32Buffer, textEncode } from "./tensorFlowHelpers";

/**
 * @name - TFRecords Feature Type
 * @description - Defines the type of TFRecords Feature
 * @member String - Specifies a Feature as a string
 * @member Binary - Specifies a Feature as a binary UInt8Array
 * @member Int64 - Specifies a Feature as a Int64
 * @member Float - Specifies a Feature as a Float
 */
export enum FeatureType {
    String = 0,
    Binary = 1,
    Int64 = 2,
    Float = 3,
}

/**
 * @name - TFRecords Builder Class
 * @description - Create a TFRecords object
 */
export class TFRecordsBuilder {
    /**
     * @records - An Array of TFRecord Buffer created with releaseTFRecord()
     * @description - Return a Buffer representation of a TFRecords object
     */
    public static buildTFRecords(records: Buffer[]): Buffer {
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
     * @type - Feature Type
     * @value - A Int64 | Float | String | Binary value
     * @description - Add a Int64 | Float | String | Binary value feature
     */
    public addFeature(key: string, type: FeatureType, value: string | number | Uint8Array) {
        this.addArrayFeature(key, type, [value]);
    }

    /**
     * @key - Feature Key
     * @type - Feature Type
     * @value - An Array of Int64 | Float | String | Binary values
     * @description - Add an Array of Int64 | Float | String | Binary values feature
     */
    public addArrayFeature<T extends string | number | Uint8Array>(key: string, type: FeatureType, values: T[]) {
        const feature = new Feature();

        switch (type) {
            case FeatureType.String:
                const stringList = new BytesList();
                values.forEach((value) => {
                    stringList.addValue(textEncode(value as string));
                });
                feature.setBytesList(stringList);
                break;
            case FeatureType.Binary:
                const byteList = new BytesList();
                values.forEach((value) => {
                    byteList.addValue(value);
                });
                feature.setBytesList(byteList);
                break;
            case FeatureType.Int64:
                const intList = new Int64List();
                values.forEach((value) => {
                    intList.addValue(value);
                });
                feature.setInt64List(intList);
                break;
            case FeatureType.Float:
                const floatList = new FloatList();
                values.forEach((value) => {
                    floatList.addValue(value);
                });
                feature.setFloatList(floatList);
                break;
            default:
                break;
        }

        const featuresMap = this.features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    /**
     * @description - Return a Buffer representation of a single TFRecord
     */
    public build(): Buffer {
        // Get Protocol Buffer TFRecords object with exported image features
        const imageMessage = new TFRecordsImageMessage();
        imageMessage.setContext(this.features);

        // Serialize Protocol Buffer in a buffer
        const bytes = imageMessage.serializeBinary();
        return new Buffer(bytes);
    }
}
