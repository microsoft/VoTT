import CanvasHelpers from "./canvasHelpers";
import MockFactory from "../../../../common/mockFactory";

describe("Canvas Helpers", () => {
    it("Adds a tag to list", () => {
        const originalTags = MockFactory.createTestTags();
        const originalLength = originalTags.length;
        const newTag = MockFactory.createTestTag("New Tag");
        const newTags = CanvasHelpers.toggleTag(
            originalTags,
            newTag,
        );
        expect(newTags).toHaveLength(originalLength + 1);
        expect(newTags[newTags.length - 1]).toEqual(newTag);
    });

    it("Removes a tag from list", () => {
        const originalTags = MockFactory.createTestTags();
        const originalLength = originalTags.length;
        const originalFirstTag = originalTags[0];
        const newTags = CanvasHelpers.toggleTag(
            originalTags,
            originalTags[0],
        );
        expect(newTags).toHaveLength(originalLength - 1);
        expect(newTags[0]).not.toEqual(originalFirstTag);
    });

    it("Creates region data from region", () => {
        expect(true).toBeTruthy();
    });

    it("Creates a tag descriptor from region", () => {
        expect(true).toBeTruthy();
    });
});
