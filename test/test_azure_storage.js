BlobService = require('../src/lib/azure_blob/azure_blob_service.js')
blobService = new BlobService;

function stringify(p){
    p.then(
        (result) => {console.log(JSON.stringify(result));},
        (err) => {console.log('rejected' + err);}
    );
}

stringify(blobService.listContainers());
stringify(blobService.listBlobs("new-container"));
stringify(blobService.createContainer("another-container"));


