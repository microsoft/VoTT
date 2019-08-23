import { IAssetMetadata, ITag } from "../../models/applicationState";

/**
 * A helper function to split train and test assets
 * @param template String containing variables
 * @param params Params containing substitution values
 */
export function splitTestAsset(allAssets: IAssetMetadata[], tags: ITag[], testSplitRatio: number): string[] {
    if (testSplitRatio <= 0 || testSplitRatio > 1) { return []; }

    const testAssets: string[] = [];
    const tagsAssetDict: { [index: string]: { assetList: Set<string> } } = {};
    tags.forEach((tag) => tagsAssetDict[tag.name] = { assetList: new Set() });
    allAssets.forEach((assetMetadata) => {
        assetMetadata.regions.forEach((region) => {
            region.tags.forEach((tagName) => {
                if (tagsAssetDict[tagName]) {
                    tagsAssetDict[tagName].assetList.add(assetMetadata.asset.name);
                }
            });
        });
    });

    for (const tagKey of Object.keys(tagsAssetDict)) {
        const assetList = tagsAssetDict[tagKey].assetList;
        const testCount = Math.ceil(assetList.size * testSplitRatio);
        testAssets.push(...Array.from(assetList).slice(0, testCount));
    }
    return testAssets;
}
