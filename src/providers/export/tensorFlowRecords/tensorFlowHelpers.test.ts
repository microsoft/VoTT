import { crc32c, maskCrc, getInt64Buffer, getInt32Buffer, textEncode, textDecode } from "./tensorFlowHelpers";

describe("TFRecords Helper Functions", () => {
    describe("Run getInt64Buffer method test", () => {
        it("Check getInt64Buffer for number 164865", async () => {
            expect(getInt64Buffer(164865)).toEqual(new Buffer([1, 132, 2, 0, 0, 0, 0, 0]));
        });
    });

    describe("Run getInt32Buffer method test", () => {
        it("Check getInt32Buffer for number 164865", async () => {
            expect(getInt32Buffer(164865)).toEqual(new Buffer([1, 132, 2, 0]));
        });
    });

    describe("Run crc32c method test", () => {
        it("Check crc32c for number 164865", async () => {
            expect(crc32c(new Buffer([1, 132, 2, 0, 0, 0, 0, 0]))).toEqual(1310106699);
        });
    });

    describe("Run maskCrc method test", () => {
        it("Check maskCrc for crc 1310106699", async () => {
            expect(maskCrc(1310106699)).toEqual(3944318725);
        });
    });

    describe("Run integration of getInt32Buffer(maskCrc(crc32c(getInt64Buffer())) methods test", () => {
        it("Check maskCrc for for number 164865", async () => {
            expect(getInt32Buffer(maskCrc(crc32c(getInt64Buffer(164865)))))
                .toEqual(new Buffer([5, 135, 25, 235]));
        });
    });

    describe("Run textEncode method test", () => {
        it("Check textEncode for string 'ABC123'", async () => {
            expect(textEncode("ABC123")).toEqual(new Uint8Array([65, 66, 67, 49, 50, 51]));
        });
    });

    describe("Run textDecode method test", () => {
        it("Check textDecode for array [65, 66, 67, 49, 50, 51]", async () => {
            expect(textDecode(new Uint8Array([65, 66, 67, 49, 50, 51]))).toEqual("ABC123");
        });
    });
});
