export const itemTemplate = "\
item {\n\
 id: ${id}\n\
 name: '${tag}'\n\
}\n";

export const annotationTemplate = "\
<annotation verified=\"yes\">\n\
    <folder>Annotation</folder>\n\
    <filename>${fileName}</filename>\n\
    <path>${filePath}</path>\n\
    <source>\n\
        <database>Unknown</database>\n\
    </source>\n\
    <size>\n\
        <width>${width}</width>\n\
        <height>${height}</height>\n\
        <depth>3</depth>\n\
    </size\>\n\
    <segmented>0</segmented>\n\
    ${objects}\n\
</annotation\>\n";

export const objectTemplate = "\
<object>\n\
    <name>${name}</name>\n\
    <pose>Unspecified</pose>\n\
    <truncated>0</truncated>\n\
    <difficult>0</difficult>\n\
    <bndbox>\n\
        <xmin>${xmin}</xmin>\n\
        <ymin>${ymin}</ymin>\n\
        <xmax>${xmax}</xmax>\n\
        <ymax>${ymax}</ymax>\n\
    </bndbox>\n\
</object>";
