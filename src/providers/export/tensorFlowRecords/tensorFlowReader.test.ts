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
    });
});
