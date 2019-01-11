export const itemTemplate = `
item {
    id: %ID%
    name: '%TAG%'
}`;

export const annotationTemplate = `
<annotation verified="yes">
    <folder>Annotation</folder>
    <filename>%FILE_NAME%</filename>
    <path>%FILE_PATH%</path>
    <source>
        <database>Unknown</database>
    </source>
    <size>
        <width>%WIDTH%</width>
        <height>%HEIGHT%</height>
        <depth>3</depth>
    </size\>
    <segmented>0</segmented>
    %OBJECTS%
</annotation\>`;

export const objectTemplate = `
<object>
    <name>%OBJECT_TAG_NAME%</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
        <xmin>%OBJECT_TAG_xmin%</xmin>
        <ymin>%OBJECT_TAG_ymin%</ymin>
        <xmax>%OBJECT_TAG_xmax%</xmax>
        <ymax>%OBJECT_TAG_ymax%</ymax>
    </bndbox>
</object>`;
