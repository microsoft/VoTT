import { IStorageProvider } from "./storageProviderFactory";
import { IAsset, AssetType, StorageType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import {
    TokenCredential, AnonymousCredential, ContainerURL,
    StorageURL, ServiceURL, Credential, Aborter, BlockBlobURL,
} from "@azure/storage-blob";
import { BlobDeleteResponse } from "@azure/storage-blob/typings/lib/generated/lib/models";
import AWS from 'aws-sdk';



/**
 * Options for AWSS3 Cloud Storage
 * @member accountName - Name of Storage Account
 * @member bucketName - Name of targeted container
 * @member createContainer - Option for creating container in `initialize()`
 * @member sas - Shared Access Signature (SAS) token for accessing AWSS3 Blob Storage
 * @member oauthToken - Not yet implemented. Optional token for accessing AWSS3 Blob Storage
 */
export interface IAWSS3CloudStorageOptions {
    bucketName: string;
    folderName: string;
    region: string;
    createFolder: boolean;
    secret: string;
    token: string;
    sas?: string;
    oauthToken?: string;
}

/**
 * Storage Provider for AWSS3 Blob Storage
 */
export class AWSS3BlobStorage implements IStorageProvider {

    /**
     * Storage type
     * @returns - StorageType.Cloud
     */
    public s3Obj = null;
    public storageType: StorageType = StorageType.Cloud;

    constructor(private options?: IAWSS3CloudStorageOptions) { }

    /**
     * Initialize connection to Blob Storage account & container
     * If `createContainer` was specified in options, this function
     * creates the container. Otherwise, validates that container
     * is contained in list of containers
     * @throws - Error if container does not exist or not able to
     * connect to AWSS3 Blob Storage
     */


    public async initialize(): Promise<void> {

        const bucketName = this.options.bucketName;
        if (this.options.createFolder) {
            //For now this feature is not supported
        } else {
            console.log('assume that bucket exists');
            // const containers = await this.listContainers(null);
            // if (containers.indexOf(containerName) === -1) {
            //     throw new Error(`Container "${containerName}" does not exist`);
            // }
            const params = {
                Bucket: bucketName
            }
            try {
                await this.s3().headObject(params).promise()
                console.log("File Found in S3")
            } catch (err) {
                console.log("File not Found ERROR : " + err.code)
            }

        }

    }

    public async listContainers(path: string) {
        //Not implemented
        const result: string[] = [];
        return result;
    }

    public s3(){
        AWS.config.update({region: this.options.region});
        AWS.config.update({accessKeyId: this.options.token,
            secretAccessKey: this.options.secret});

        this.s3Obj = this.s3Obj || new AWS.S3({apiVersion: '2006-03-01'});
        return this.s3Obj;
    }

    public async listMyObjects() {
        var bucketParams = {
            Bucket : this.options.bucketName,
            Prefix: this.options.folderName+'/'
        };
        var res = this.s3().listObjects(bucketParams).promise();
        var re = await res;
        return re.Contents;
    }

    /**
     * Reads text from specified blob
     * @param blobName - Name of blob in container
     */
    public async readText(blobName: string): Promise<string> {
        var key = blobName.startsWith(this.options.folderName) ? blobName :  this.options.folderName+'/'+blobName
        var res = await this.s3().getObject({ Bucket: this.options.bucketName, Key: key }).promise();
        res = await res.Body.toString();
        return res;
    }

    /**
     * Reads Buffer from specified blob
     * @param blobName - Name of blob in container
     */
    public async readBinary(blobName: string) {
        const text = await this.readText(blobName);
        return Buffer.from(text);
    }

    /**
     * Writes text to blob in container
     * @param blobName - Name of blob in container
     * @param content - Content to write to blob (string or Buffer)
     */
    public async writeText(blobName: string, content: string | Buffer) {
        var uploadParams = {Bucket: this.options.bucketName, Key: this.options.folderName+'/'+blobName, Body: content};
        var res = await this.s3().upload(uploadParams).promise();
        return res
    }

    /**
     * Writes buffer to blob in container
     * @param blobName - Name of blob in container
     * @param content - Buffer to write to blob
     */
    public writeBinary(blobName: string, content: Buffer) {
        return this.writeText(blobName, content);
    }

    /**
     * Deletes file from container
     * @param blobName - Name of blob in container
     */
    public async deleteFile(blobName: string): Promise<void> {
        var uploadParams = {Bucket: this.options.bucketName, Key: this.options.folderName+'/'+blobName};
        var res = await this.s3().deleteObject(uploadParams).promise();
        return res;
    }

    /**
     * Lists files in container
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Only uses container
     * as specified in AWSS3 Cloud Storage Options. Included to satisfy
     * Storage Provider interface
     * @param ext - Extension of files to filter on when retrieving files
     * from container
     */
    public async listFiles(path: string, ext?: string): Promise<string[]> {
        const result: string[] = [];
        var res = await this.listMyObjects();
        var keys=[];
        for (var r of res) {
            if ((ext && r.Key.endsWith(ext)) || !ext) {
                keys.push(r.Key);
            }
        }

        return keys;
    }

    /**
     * Creates container specified in AWSS3 Cloud Storage options
     * @param bucketName - NOT USED IN CURRENT IMPLEMENTATION. Because `bucketName`
     * is a required attribute of the AWSS3 Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async createContainer(bucketName: string): Promise<void> {
        console.log('aws container creation is not supported yet');
        // const containerURL = this.getContainerURL();
        // try {
        //     await containerURL.create(Aborter.none);
        // } catch (e) {
        //     if (e.statusCode === 409) {
        //         return;
        //     }
        //
        //     throw e;
        // }
    }

    /**
     * Deletes container specified in AWSS3 Cloud Storage options
     * @param bucketName - NOT USED IN CURRENT IMPLEMENTATION. Because `bucketName`
     * is a required attribute of the AWSS3 Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async deleteContainer(bucketName: string): Promise<void> {
        //await this.getContainerURL().delete(Aborter.none);
        console.log('aws container deletion is not supported yet');
    }

    /**
     * Retrieves assets from AWSS3 Blob Storage container
     * @param bucketName - Container from which to retrieve assets. Defaults to
     * container specified in AWSS3 Cloud Storage options
     */
    public async getAssets(bucketName?: string): Promise<IAsset[]> {
        bucketName = (bucketName) ? bucketName : this.options.bucketName;
        const files = await this.listFiles(bucketName);
        const result: IAsset[] = [];
        for (const file of files) {
            const url = await this.getUrl(file);
            const asset = AssetService.createAssetFromFilePath(url, this.getFileName(url));
            if (asset.type !== AssetType.Unknown) {
                result.push(asset);
            }
        }
        return result;
    }

    /**
     *
     * @param url - URL for AWSS3 Blob
     */
    public getFileName(url: string) {
        const pathParts = url.split("/");
        return pathParts[pathParts.length - 1].split("?")[0];
    }

    /**
     * @returns - URL for AWSS3 Blob Storage account with SAS token appended if specified
     */
    public getAccountUrl(): string {

        return `https://${this.options.region}.amazonaws.com/${this.options.bucketName}/${this.options.folderName ? this.options.folderName+'/' : ''}`;
    }


    private getBlockBlobURL(blobName: string) {
        return this.getUrl(blobName);

    }

    private getServiceURL(){
        //Not implemented

    }

    private async getUrl(blobName: string) {
        var getSignedUrlParams = {
            Bucket: this.options.bucketName,
            Key: blobName,
            Expires: 3600 * 24
        };
        return this.s3().getSignedUrl('getObject', getSignedUrlParams);
    }

}
