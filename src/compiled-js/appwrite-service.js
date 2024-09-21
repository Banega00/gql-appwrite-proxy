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
const auth_service_1 = require("./auth.service");
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
    getUserFromJWT(authorization) {
        return __awaiter(this, void 0, void 0, function* () {
            const jwtData = auth_service_1.authService.verifyJwt(authorization);
            const user = yield this.getUserFromSession(jwtData.session);
            return user;
        });
    }
    getUserFromSession(sessionSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new node_appwrite_1.Client().setEndpoint(appwrite_config_1.AppwriteConfig.APPWRITE_ENDPOINT).setProject(appwrite_config_1.AppwriteConfig.APPWRITE_PROJECT_ID).setSession(sessionSecret);
            const account = new node_appwrite_1.Account(client);
            const user = yield account.get();
            return user;
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
                user = yield users.create(userId !== null && userId !== void 0 ? userId : node_appwrite_1.ID.unique(), undefined, phoneNumber);
            }
            // user.prefs = await users.updatePrefs(user.$id, { tokens });
            const session = yield users.createSession(user.$id);
            return session;
        });
    }
    createOrUpdateUserFromSession(userId, sessionSecret, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new node_appwrite_1.Client().setEndpoint(appwrite_config_1.AppwriteConfig.APPWRITE_ENDPOINT).setProject(appwrite_config_1.AppwriteConfig.APPWRITE_PROJECT_ID).setSession(sessionSecret);
            const account = new node_appwrite_1.Account(client);
            const user = yield account.get();
            const users = new node_appwrite_1.Users(this.adminClient);
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
                        const newUser = yield users.create(userId, undefined, phoneNumber);
                        const sess = yield users.createSession(newUser.$id);
                        console.log('SESSION CREATED FOR NEW USER', sess);
                        return sess;
                    }
                    else {
                        //everything ok get new session
                        console.log('CREATING NEW SESSION FOR USER WITH ID', existingUser.$id);
                        const sess = yield users.createSession(existingUser.$id);
                        console.log('SESSION CREATED FOR NEW USER', sess);
                        return sess;
                    }
                }
                else {
                    const newUser = yield users.create(userId, undefined, phoneNumber);
                    return users.createSession(newUser.$id);
                }
            }
            else {
                //update user
                user.phone = phoneNumber;
                yield users.updatePhone(userId, phoneNumber); //create new session
                return users.createSession(user.$id);
            }
        });
    }
    checkUserSession(sessionSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('SESSION SECRET IS', sessionSecret);
            const client = new node_appwrite_1.Client().setEndpoint(appwrite_config_1.AppwriteConfig.APPWRITE_ENDPOINT).setProject(appwrite_config_1.AppwriteConfig.APPWRITE_PROJECT_ID).setSession(sessionSecret);
            const account = new node_appwrite_1.Account(client);
            const user = yield account.get();
            if (!user) {
                throw new Error('Invalid appwrite session');
            }
            return true;
        });
    }
}
exports.appwriteService = new AppwriteService();
