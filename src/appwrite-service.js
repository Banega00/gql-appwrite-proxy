"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appwriteService = void 0;
const node_appwrite_1 = require("node-appwrite");
const appwrite_config_1 = require("./appwrite-config");
class AppwriteService {
    constructor() {
        this.adminClient = new node_appwrite_1.Client();
        const { APPWRITE_ENDPOINT, APPWRITE_API_KEY, APPWRITE_PROJECT_ID } = appwrite_config_1.AppwriteConfig;
        if (!APPWRITE_ENDPOINT || !APPWRITE_API_KEY || !APPWRITE_PROJECT_ID) {
            throw new Error('Appwrite config is not set');
        }
        this.adminClient = this.adminClient.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
        this.account = new node_appwrite_1.Account(this.adminClient);
    }
    test() {
        return 'test successss';
    }
    createAnonymousSession() {
        return __awaiter(this, void 0, void 0, function* () {
            const account = new node_appwrite_1.Account(this.adminClient);
            const anonymousSession = yield account.createAnonymousSession();
            return anonymousSession;
        });
    }
    createSessionForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = new node_appwrite_1.Users(this.adminClient);
            const session = yield users.createSession(userId);
            return session;
        });
    }
    updateUser(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = new node_appwrite_1.Users(this.adminClient);
            const currentUser = yield user.get(userId);
            currentUser.name != data.name && (yield user.updateName(userId, data.name));
            currentUser.email != data.email && (yield user.updateEmail(userId, data.email));
            currentUser.password != data.password && (yield user.updatePassword(userId, data.password));
            return yield user.get(userId);
        });
    }
    createOrSignInUser(input, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber } = input;
            const users = new node_appwrite_1.Users(this.adminClient);
            let user = (yield users.list([node_appwrite_1.Query.equal('phone', phoneNumber)])).users[0];
            if (!user) {
                user = yield users.create(userId ? node_appwrite_1.ID.custom(userId) : node_appwrite_1.ID.unique(), undefined, phoneNumber);
            }
            // user.prefs = await users.updatePrefs(user.$id, { tokens });
            const session = yield users.createSession(user.$id);
            return session;
        });
    }
    createOrUpdateUser(userId, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = new node_appwrite_1.Users(this.adminClient);
            const user = yield users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }
            else if (user.$id != userId) {
                //delete old anonymous user
                yield users.delete(user.$id);
                const [existingUser] = (yield users.list([node_appwrite_1.Query.equal('phone', phoneNumber)])).users;
                if (existingUser) {
                    if (existingUser.$id != userId) {
                        yield users.delete(existingUser.$id);
                        const newUser = yield users.create(node_appwrite_1.ID.custom(userId), undefined, phoneNumber);
                        return newUser;
                    }
                    else {
                        return user;
                    }
                }
                else {
                    const newUser = yield users.create(node_appwrite_1.ID.custom(userId), undefined, phoneNumber);
                    return newUser;
                }
            }
            else {
                //update user
                if (user.phone != phoneNumber) {
                    user.phone = phoneNumber;
                    yield users.updatePhone(userId, phoneNumber); //create new session
                }
                return user;
            }
        });
    }
}
exports.appwriteService = new AppwriteService();
