"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.authService = exports.AuthService = void 0;
const api_server_service_1 = require("./api-server.service");
const appwrite_service_1 = require("./appwrite-service");
const jwt = __importStar(require("jsonwebtoken"));
const helpers_1 = require("./helpers");
class AuthService {
    constructor() { }
    signup(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const session = yield appwrite_service_1.appwriteService.createOrSignInUser(input);
            const responseData = yield api_server_service_1.apiServerService.sendPostGraphQLRequest({
                query: `mutation Signup {
        signup(input: { phoneNumber: "${input.phoneNumber}" }) {
            accessToken
            refreshToken
            code
        }
    }`,
            });
            (0, helpers_1.handleGraphQLErrorsFromAPI)(responseData);
            if (!((_a = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _a === void 0 ? void 0 : _a.signup)) {
                console.log(responseData);
                throw new Error('Error signing up');
            }
            else {
                const tokens = this.createTokens({ sessionSecret: session.secret, userId: session.userId, phoneNumber: input.phoneNumber });
                return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, code: responseData.data.signup.code };
            }
        });
    }
    verify(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, code, sessionSecret } = obj;
            console.log('SALJEM VERIFY ZAHTEV');
            const responseData = yield api_server_service_1.apiServerService.sendPostGraphQLRequest({
                query: `mutation Verify {
      verify(input: { phoneNumber: "${phoneNumber}", code: "${code}" }) {
          accessToken
          refreshToken
      }
  }
  `,
            });
            (0, helpers_1.handleGraphQLErrorsFromAPI)(responseData);
            if (!responseData.data.verify) {
                console.log(responseData);
                throw new Error('Error verifying');
            }
            else {
                return responseData.data.verify;
            }
        });
    }
    createTokens(payload) {
        const accessToken = this.createAccessToken(payload);
        const refreshToken = this.createRefreshToken(payload);
        return { accessToken, refreshToken };
    }
    createAccessToken(payload) {
        return jwt.sign(payload !== null && payload !== void 0 ? payload : {}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '10m',
        });
    }
    createRefreshToken(payload) {
        return jwt.sign(payload !== null && payload !== void 0 ? payload : {}, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '480m',
        });
    }
    verifyJwt(jwtToken) {
        var _a;
        const splitted = jwtToken.split(' ');
        const token = (_a = splitted[1]) !== null && _a !== void 0 ? _a : splitted[0];
        try {
            const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!data.sessionSecret)
                throw new Error('Invalid token');
            return data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
