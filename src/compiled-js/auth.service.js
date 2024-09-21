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
    recodeAPITokensDataToProxyTokens(apiTokens, proxyTokenData) {
        const apiAccessTokenData = this.decodeApiTokensData(apiTokens.accessToken);
        const payloadForTokens = Object.assign(Object.assign({}, proxyTokenData), apiAccessTokenData);
        console.log('PROXY TOKEN DATA', proxyTokenData);
        console.log('CREATING TOKENS WITH PAYLOAD', payloadForTokens);
        return this.createTokens(payloadForTokens);
    }
    recodeProxyTokensDataToAPITokens(proxyTokensData) {
        const apiTokens = this.createTokens(proxyTokensData, 'api');
        return apiTokens;
    }
    constructor() {
        this.decodeApiTokensData = (accessToken) => jwt.decode(accessToken);
    }
    signup(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const session = yield appwrite_service_1.appwriteService.createAnonymousSession();
                const tokens = this.createTokens({ session: session.secret, phoneNumber: input.phoneNumber });
                return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, code: responseData.data.signup.code };
            }
        });
    }
    verify(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, code, session } = obj;
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
    createSessionForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return appwrite_service_1.appwriteService.createSessionForUser(userId);
        });
    }
    createTokens(payload, forServer = 'proxy') {
        const accessToken = this.createAccessToken(payload, forServer);
        const refreshToken = this.createRefreshToken(payload, forServer);
        return { accessToken, refreshToken };
    }
    createAccessToken(payload, forServer = 'proxy') {
        const secret = forServer === 'api' ? process.env.API_ACCESS_TOKEN_SECRET : process.env.ACCESS_TOKEN_SECRET;
        const options = (payload === null || payload === void 0 ? void 0 : payload.exp) && (payload === null || payload === void 0 ? void 0 : payload.iat) ? {} : { expiresIn: '10m' };
        return jwt.sign(payload !== null && payload !== void 0 ? payload : {}, secret, options);
    }
    createRefreshToken(payload, forServer = 'proxy') {
        const secret = forServer === 'api' ? process.env.API_REFRESH_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET;
        const options = (payload === null || payload === void 0 ? void 0 : payload.exp) && (payload === null || payload === void 0 ? void 0 : payload.iat) ? {} : { expiresIn: '480m' };
        return jwt.sign(payload !== null && payload !== void 0 ? payload : {}, secret, options);
    }
    verifyJwt(jwtToken) {
        var _a;
        const splitted = jwtToken.split(' ');
        const token = (_a = splitted[1]) !== null && _a !== void 0 ? _a : splitted[0];
        try {
            const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!data.session)
                throw new Error('Invalid token');
            return data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    verifyRefreshJwt(jwtToken) {
        var _a;
        console.log(jwtToken);
        const splitted = jwtToken.split(' ');
        const token = (_a = splitted[1]) !== null && _a !== void 0 ? _a : splitted[0];
        try {
            const data = jwt.verify(token, process.env.API_REFRESH_TOKEN_SECRET);
            return data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    refreshTokens(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const responseData = yield api_server_service_1.apiServerService.sendPostGraphQLRequest({
                query: `mutation RefreshTokens {
      refreshTokens(input: { refreshToken: "${refreshToken}"}) {
          accessToken
          refreshToken
      }
  }
  `,
            }, `Bearer ${refreshToken}`);
            (0, helpers_1.handleGraphQLErrorsFromAPI)(responseData);
            if (!responseData.data.refreshTokens) {
                console.log(responseData);
                throw new Error('Error refresh tokens');
            }
            else {
                return responseData.data.refreshTokens;
            }
        });
    }
    getVenuesForEmployeeOrGroup(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const responseData = yield api_server_service_1.apiServerService.sendPostGraphQLRequest({
                query: `query Venue {
    venue {
        id
        name
        address
        createdAt
        updatedAt
    }
}
  `,
            }, `Bearer ${accessToken}`);
            (0, helpers_1.handleGraphQLErrorsFromAPI)(responseData);
            if (!responseData.data.venue) {
                console.log(responseData);
                throw new Error('Error getting venues');
            }
            else {
                return responseData.data.venue;
            }
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
