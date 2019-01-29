import { TFRecordsBuilder, FeatureType } from "./tensorFlowBuilder";

describe("TFRecords Builder Functions", () => {
    describe("Check Adding Single Features", () => {
        let builder: TFRecordsBuilder;
        beforeEach(() => {
            builder = new TFRecordsBuilder();
        });

        it("Check addIntFeature", async () => {
            builder.addFeature("image/height", FeatureType.Int64, 123);

            expect(builder.build()).toEqual(
                new Buffer([10, 23, 10, 21, 10, 12, 105, 109, 97, 103, 101, 47, 104,
                            101, 105, 103, 104, 116, 18, 5, 26, 3, 10, 1, 123]));
        });

        it("Check addFloatFeature", async () => {
            builder.addFeature("image/height", FeatureType.Float, 123.0);

            expect(builder.build()).toEqual(
                new Buffer([10, 26, 10, 24, 10, 12, 105, 109, 97, 103, 101, 47, 104,
                            101, 105, 103, 104, 116, 18, 8, 18, 6, 10, 4, 0, 0, 246, 66]));
        });

        it("Check addStringFeature", async () => {
            builder.addFeature("image/height", FeatureType.String, "123");

            expect(builder.build()).toEqual(
                new Buffer([10, 25, 10, 23, 10, 12, 105, 109, 97, 103, 101, 47, 104,
                            101, 105, 103, 104, 116, 18, 7, 10, 5, 10, 3, 49, 50, 51]));
        });
    });

    describe("Check single TFRecord generation with arrays", () => {
        let builder: TFRecordsBuilder;

        it("Check releaseTFRecord", async () => {
            builder = new TFRecordsBuilder();

            builder.addArrayFeature("image/height", FeatureType.Int64, [1, 2]);
            builder.addArrayFeature("image/height", FeatureType.Float, [1.0, 2.0]);
            builder.addArrayFeature("image/height", FeatureType.String, ["1", "2"]);

            const buffer = builder.build();
            expect(buffer.length).toEqual(28);

            const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);
            // 16 = 8bytes for Lenght + 4bytes for CRC(Length) + 4bytes CRC(buffer)
            const headersSize = 16;
            expect(tfrecords.length).toEqual(28 + headersSize);
        });
    });
});
