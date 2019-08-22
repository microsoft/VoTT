import { StorageAccounts, StorageManagementClientContext } from "@azure/arm-storage"
import { AuthManager, LoggedIn } from "@azure/ms-rest-browserauth"

export class AuthenticationService {

    private credentials;
    private availableSubscriptions;

    public constructor(private clientId: string) {}

    public async login() {
        const authManager = new AuthManager({ clientId: this.clientId });
        let result = await authManager.finalizeLogin();
        if (!result.isLoggedIn) {
            authManager.login();
        }
        result = result as LoggedIn;
        this.credentials = result.creds;
        this.availableSubscriptions = result.availableSubscriptions;
    }

    // public async getStorageAccountKey(subscriptionId: string, resourceGroupName: string, accountName: string, credentials: ServiceClientCredentials) {
    //     const context = new StorageManagementClientContext(this.credentials, subscriptionId);
    //     const storageAccounts = new StorageAccounts(context);
    //     const accounts = await storageAccounts.list();
    //     if (!accounts.find((account) => account.name === accountName)) {
    //         throw new Error(`Couldn't find storage account with name ${accountName}`);
    //     }
    //     const { keys } = await storageAccounts.listKeys(resourceGroupName, accountName);
    //     return keys[0].value;
    // }
}
