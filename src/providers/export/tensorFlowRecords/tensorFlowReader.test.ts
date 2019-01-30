import { TFRecordsBuilder, FeatureType } from "./tensorFlowBuilder";
import { TFRecordsReader } from "./tensorFlowReader";

describe("TFRecords Reader/Builder Integration test", () => {
    describe("Check Adding Single TFRecords", () => {
        let builder: TFRecordsBuilder;
        beforeEach(() => {
            builder = new TFRecordsBuilder();
        });

        it("Check single TFRecord", async () => {
            builder.addArrayFeature("image/height", FeatureType.Int64, [1, 2]);
            builder.addArrayFeature("image/height", FeatureType.Float, [1.0, 2.0]);
            builder.addArrayFeature("image/height", FeatureType.String, ["1", "2"]);

            const buffer = builder.build();
            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);
            expect(tfrecords.length).toEqual(44);

            const reader = new TFRecordsReader(tfrecords);

            expect(reader.length()).toEqual(1);
        });

        it("Check multiple TFRecords", async () => {
            builder.addArrayFeature("image/height", FeatureType.Int64, [1, 2]);
            builder.addArrayFeature("image/height", FeatureType.Float, [1.0, 2.0]);
            builder.addArrayFeature("image/height", FeatureType.String, ["1", "2"]);

            const buffer = builder.build();
            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer, buffer]);
            expect(tfrecords.length).toEqual(88);

            const reader = new TFRecordsReader(tfrecords);

            expect(reader.length()).toEqual(2);
        });
    });
});
