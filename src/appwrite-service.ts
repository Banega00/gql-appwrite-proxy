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
      user = await users.create(userId ? ID.custom(userId) : ID.unique(), undefined, phoneNumber);
    }

    // user.prefs = await users.updatePrefs(user.$id, { tokens });

    const session = await users.createSession(user.$id);

    return session;
  }

  async createOrUpdateUser(userId: string, phoneNumber: string) {
    const users = new Users(this.adminClient);
    const user = await users.get(userId);
    if (!user) {
      throw new Error('User not found');
    } else if (user.$id != userId) {
      //delete old anonymous user
      await users.delete(user.$id);
      const [existingUser] = (await users.list([Query.equal('phone', phoneNumber)])).users;
      if (existingUser) {
        if (existingUser.$id != userId) {
          await users.delete(existingUser.$id);
          const newUser = await users.create(ID.custom(userId), undefined, phoneNumber);
          return newUser;
        } else {
          return user;
        }
      } else {
        const newUser = await users.create(ID.custom(userId), undefined, phoneNumber);
        return newUser;
      }
    } else {
      //update user
      if (user.phone != phoneNumber) {
        user.phone = phoneNumber;
        await users.updatePhone(userId, phoneNumber); //create new session
      }
      return user;
    }
  }
}

export const appwriteService = new AppwriteService();
