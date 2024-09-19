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
        this.account = new node_appwrite_1.Account(this.adminClient);
        const { APPWRITE_ENDPOINT, APPWRITE_API_KEY, APPWRITE_PROJECT_ID } = appwrite_config_1.AppwriteConfig;
        if (!APPWRITE_ENDPOINT || !APPWRITE_API_KEY || !APPWRITE_PROJECT_ID) {
            throw new Error('Appwrite config is not set');
        }
        this.adminClient = this.adminClient.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
    }
    test() {
        return 'test success';
    }
    createAnonymousSession() {
        return __awaiter(this, void 0, void 0, function* () {
            const account = new node_appwrite_1.Account(this.adminClient);
            const anonymousSession = yield account.createAnonymousSession();
            return anonymousSession;
        });
    }
    getUserFromSessionSecret(secret) {
        return __awaiter(this, void 0, void 0, function* () {
            const { APPWRITE_ENDPOINT, APPWRITE_API_KEY, APPWRITE_PROJECT_ID } = appwrite_config_1.AppwriteConfig;
            const sessionClient = new node_appwrite_1.Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
            sessionClient.setSession(secret);
            const account = new node_appwrite_1.Account(sessionClient);
            const currentUser = yield account.get();
            return currentUser;
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
}
exports.appwriteService = new AppwriteService();
