BlobService = require('../src/lib/azure_blob/azure_blob_service.js')
blobService = new BlobService;

function stringify(p){
    p.then(
        (result) => {console.log(JSON.stringify(result));},
        (err) => {console.log('rejected' + err);}
    );
}

let containers = await blobService.listContainers();

stringify(blobService.listContainers());
stringify(blobService.listBlobs("new-container"));
stringify(blobService.createContainer("another-container"));


