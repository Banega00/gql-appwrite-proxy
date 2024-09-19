import { Account, Client, Users } from 'node-appwrite';
// import { AppwriteConfig } from './appwrite-config';

// class AppwriteService {
//   private adminClient: Client;
//   private account: Account;

//   constructor() {
//     this.adminClient = new Client();
//     this.account = new Account(this.adminClient);

//     const { APPWRITE_ENDPOINT, APPWRITE_API_KEY, APPWRITE_PROJECT_ID } = AppwriteConfig;

//     if (!APPWRITE_ENDPOINT || !APPWRITE_API_KEY || !APPWRITE_PROJECT_ID) {
//       throw new Error('Appwrite config is not set');
//     }

//     this.adminClient = this.adminClient.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
//   }

//   test() {
//     return 'test success';
//   }

//   public async createAnonymousSession() {
//     const account = new Account(this.adminClient);

//     const anonymousSession = await account.createAnonymousSession();
//     return anonymousSession;
//   }

//   async getUserFromSessionSecret(secret: string) {
//     const { APPWRITE_ENDPOINT, APPWRITE_API_KEY, APPWRITE_PROJECT_ID } = AppwriteConfig;

//     const sessionClient = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID!);

//     sessionClient.setSession(secret);
//     const account = new Account(sessionClient);
//     const currentUser = await account.get();
//     return currentUser;
//   }

//   async updateUser(userId: string, data: { email: string; password: string; name: string }) {
//     const user = new Users(this.adminClient);

//     const currentUser = await user.get(userId);

//     currentUser.name != data.name && (await user.updateName(userId, data.name));
//     currentUser.email != data.email && (await user.updateEmail(userId, data.email));
//     currentUser.password != data.password && (await user.updatePassword(userId, data.password));
//     return await user.get(userId);
//   }
// }

// export const appwriteService = new AppwriteService();
