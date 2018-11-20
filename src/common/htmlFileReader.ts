export default class HtmlFileReader {
    readAsText(file: File) {
        return new Promise<string | ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result) {
                    resolve(reader.result);
                } else {
                    reject();
                }
            }

            reader.readAsText(file);
        });
    }
}
