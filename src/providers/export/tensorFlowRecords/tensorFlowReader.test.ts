import { TFRecordsBuilder, FeatureType } from "./tensorFlowBuilder";
import { TFRecordsReader } from "./tensorFlowReader";

describe("TFRecords Reader/Builder Integration test", () => {
    describe("Check Adding Single TFRecords", () => {
        let builder: TFRecordsBuilder;
        beforeEach(() => {
            builder = new TFRecordsBuilder();
        });

        it("Check single TFRecord", async () => {
            builder.addArrayFeature("feature/1", FeatureType.Int64, [1, 2]);
            builder.addArrayFeature("feature/2", FeatureType.Float, [1.0, 2.0]);
            builder.addArrayFeature("feature/3", FeatureType.String, ["1", "2"]);

            const buffer = builder.build();
            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);
            expect(tfrecords.length).toEqual(89);

            const reader = new TFRecordsReader(tfrecords);

            expect(reader.length).toEqual(1);

            const jsonImage = reader.toArray();
            expect(jsonImage.length).toEqual(1);

            expect(jsonImage[0]["context"].featureMap.length).toEqual(3);

            expect(jsonImage[0]["context"].featureMap[0][0]).toEqual("feature/1");
            expect(jsonImage[0]["context"].featureMap[1][0]).toEqual("feature/2");
            expect(jsonImage[0]["context"].featureMap[2][0]).toEqual("feature/3");

            expect(jsonImage[0]["context"].featureMap[0][1]["int64List"]["valueList"].length).toEqual(2);
            expect(jsonImage[0]["context"].featureMap[1][1]["floatList"]["valueList"].length).toEqual(2);
            expect(jsonImage[0]["context"].featureMap[2][1]["bytesList"]["valueList"].length).toEqual(2);
        });

        it("Check multiple TFRecords", async () => {
            builder.addArrayFeature("feature/1", FeatureType.Int64, [1, 2]);
            builder.addArrayFeature("feature/2", FeatureType.Float, [1.0, 2.0]);
            builder.addArrayFeature("feature/3", FeatureType.String, ["1", "2"]);

            const buffer = builder.build();
            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer, buffer]);
            expect(tfrecords.length).toEqual(178);

            const reader = new TFRecordsReader(tfrecords);

            expect(reader.length).toEqual(2);

            const jsonImage = reader.toArray();
            expect(jsonImage.length).toEqual(2);

            // Check First TFRecord
            expect(jsonImage[0]["context"].featureMap.length).toEqual(3);

            expect(jsonImage[0]["context"].featureMap[0][0]).toEqual("feature/1");
            expect(jsonImage[0]["context"].featureMap[1][0]).toEqual("feature/2");
            expect(jsonImage[0]["context"].featureMap[2][0]).toEqual("feature/3");

            expect(jsonImage[0]["context"].featureMap[0][1]["int64List"]["valueList"].length).toEqual(2);
            expect(jsonImage[0]["context"].featureMap[1][1]["floatList"]["valueList"].length).toEqual(2);
            expect(jsonImage[0]["context"].featureMap[2][1]["bytesList"]["valueList"].length).toEqual(2);

            // Check Second TFRecord
            expect(jsonImage[1]["context"].featureMap.length).toEqual(3);

            expect(jsonImage[1]["context"].featureMap[0][0]).toEqual("feature/1");
            expect(jsonImage[1]["context"].featureMap[1][0]).toEqual("feature/2");
            expect(jsonImage[1]["context"].featureMap[2][0]).toEqual("feature/3");

            expect(jsonImage[1]["context"].featureMap[0][1]["int64List"]["valueList"].length).toEqual(2);
            expect(jsonImage[1]["context"].featureMap[1][1]["floatList"]["valueList"].length).toEqual(2);
            expect(jsonImage[1]["context"].featureMap[2][1]["bytesList"]["valueList"].length).toEqual(2);
        });

        it("Check feature value on a single TFRecord", async () => {
            builder.addFeature("feature/1", FeatureType.Int64, 12345);
            builder.addFeature("feature/2", FeatureType.String, "12345");
            builder.addFeature("feature/3", FeatureType.Float, 12345.0);
            builder.addFeature("feature/4", FeatureType.Binary, new Uint8Array([1, 2, 3, 4, 5]));

            const buffer = builder.build();
            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);

            const reader = new TFRecordsReader(tfrecords);
            const intValue = reader.getFeature(0, "feature/1", FeatureType.Int64) as number;
            const stringValue = reader.getFeature(0, "feature/2", FeatureType.String) as string;
            const floatValue = reader.getFeature(0, "feature/3", FeatureType.Float) as number;
            const binaryValue = reader.getFeature(0, "feature/4", FeatureType.Binary) as Uint8Array;

            expect(intValue).toEqual(12345);
            expect(stringValue).toEqual("12345");
            expect(floatValue).toEqual(12345.0);
            expect(binaryValue).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        });

        it("Check feature array value on a single TFRecord", async () => {
            builder.addArrayFeature("feature/1", FeatureType.Int64, [1, 2]);
            builder.addArrayFeature("feature/2", FeatureType.Float, [1.0, 2.0]);
            builder.addArrayFeature("feature/3", FeatureType.String, ["1", "2"]);
            builder.addArrayFeature("feature/4", FeatureType.Binary, [new Uint8Array([1]), new Uint8Array([2])]);

            const buffer = builder.build();
            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);

            const reader = new TFRecordsReader(tfrecords);
            const intValueArray = reader.getArrayFeature(0, "feature/1", FeatureType.Int64) as number[];
            const floatValueArray = reader.getArrayFeature(0, "feature/2", FeatureType.Float) as number[];
            const stringValueArray = reader.getArrayFeature(0, "feature/3", FeatureType.String) as string[];
            const binaryValueArray = reader.getArrayFeature(0, "feature/4", FeatureType.Binary) as Uint8Array[];

            expect(intValueArray.length).toEqual(2);
            expect(stringValueArray.length).toEqual(2);
            expect(floatValueArray.length).toEqual(2);
            expect(binaryValueArray.length).toEqual(2);

            expect(intValueArray[0]).toEqual(1);
            expect(intValueArray[1]).toEqual(2);
            expect(floatValueArray[0]).toEqual(1.0);
            expect(floatValueArray[1]).toEqual(2.0);
            expect(stringValueArray[0]).toEqual("1");
            expect(stringValueArray[1]).toEqual("2");
            expect(binaryValueArray[0]).toEqual(new Uint8Array([1]));
            expect(binaryValueArray[1]).toEqual(new Uint8Array([2]));
        });
    });
});
