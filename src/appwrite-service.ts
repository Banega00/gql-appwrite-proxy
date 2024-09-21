import { Account, Client, ID, Query, Users } from 'node-appwrite';
import { AppwriteConfig } from './appwrite-config';
import { SignupInput } from './dto/sign-up-input.dto';
import { authService } from './auth.service';

class AppwriteService {
  private adminClient: Client;
  private account: Account;

  constructor() {
    this.adminClient = new Client();

    const { APPWRITE_ENDPOINT, APPWRITE_API_KEY, APPWRITE_PROJECT_ID } = AppwriteConfig;

    if (!APPWRITE_ENDPOINT || !APPWRITE_API_KEY || !APPWRITE_PROJECT_ID) {
      throw new Error('Appwrite config is not set');
    }

    this.adminClient = this.adminClient.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
    this.account = new Account(this.adminClient);
  }

  test() {
    return 'test successss';
  }

  public async createAnonymousSession() {
    const account = new Account(this.adminClient);

    const anonymousSession = await account.createAnonymousSession();
    return anonymousSession;
  }

  async getUserFromJWT(authorization: string) {
    const jwtData = authService.verifyJwt(authorization);

    const user = await this.getUserFromSession(jwtData.session);
    return user;
  }

  async getUserFromSession(sessionSecret: string) {
    const client = new Client().setEndpoint(AppwriteConfig.APPWRITE_ENDPOINT).setProject(AppwriteConfig.APPWRITE_PROJECT_ID!).setSession(sessionSecret);

    const account = new Account(client);

    const user = await account.get();
    return user;
  }

  async createSessionForUser(userId: string) {
    const users = new Users(this.adminClient);
    const session = await users.createSession(userId);
    return session;
  }

  async updateUser(userId: string, data: { email: string; password: string; name: string }) {
    const user = new Users(this.adminClient);

    const currentUser = await user.get(userId);

    currentUser.name != data.name && (await user.updateName(userId, data.name));
    currentUser.email != data.email && (await user.updateEmail(userId, data.email));
    currentUser.password != data.password && (await user.updatePassword(userId, data.password));
    return await user.get(userId);
  }

  async createOrSignInUser(input: SignupInput, userId?: string) {
    const { phoneNumber } = input;
    const users = new Users(this.adminClient);
    let user = (await users.list([Query.equal('phone', phoneNumber!)])).users[0];

    if (!user) {
      user = await users.create(userId ?? ID.unique(), undefined, phoneNumber);
    }

    // user.prefs = await users.updatePrefs(user.$id, { tokens });

    const session = await users.createSession(user.$id);

    return session;
  }

  async createOrUpdateUserFromSession(userId: string, sessionSecret: string, phoneNumber: string) {
    const client = new Client().setEndpoint(AppwriteConfig.APPWRITE_ENDPOINT).setProject(AppwriteConfig.APPWRITE_PROJECT_ID!).setSession(sessionSecret);
    const account = new Account(client);
    const user = await account.get();

    const users = new Users(this.adminClient);

    if (!user) {
      throw new Error('User not found');
    } else if (user.$id != userId) {
      //delete old anonymous user
      await users.delete(user.$id);
      const [existingUser] = (await users.list([Query.equal('phone', phoneNumber)])).users;
      if (existingUser) {
        if (existingUser.$id != userId) {
          await users.delete(existingUser.$id);

          const newUser = await users.create(userId, undefined, phoneNumber);
          const sess = await users.createSession(newUser.$id);
          console.log('SESSION CREATED FOR NEW USER', sess);
          return sess;
        } else {
          //everything ok get new session
          console.log('CREATING NEW SESSION FOR USER WITH ID', existingUser.$id);
          const sess = await users.createSession(existingUser.$id);
          console.log('SESSION CREATED FOR NEW USER', sess);
          return sess;
        }
      } else {
        const newUser = await users.create(userId, undefined, phoneNumber);
        return users.createSession(newUser.$id);
      }
    } else {
      //update user
      user.phone = phoneNumber;
      await users.updatePhone(userId, phoneNumber); //create new session
      return users.createSession(user.$id);
    }
  }

  async checkUserSession(sessionSecret: string) {
    console.log('SESSION SECRET IS', sessionSecret);
    const client = new Client().setEndpoint(AppwriteConfig.APPWRITE_ENDPOINT).setProject(AppwriteConfig.APPWRITE_PROJECT_ID!).setSession(sessionSecret);
    const account = new Account(client);
    const user = await account.get();
    if (!user) {
      throw new Error('Invalid appwrite session');
    }
    return true;
  }
}

export const appwriteService = new AppwriteService();
