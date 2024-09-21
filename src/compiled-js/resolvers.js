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
exports.resolvers = exports.wrapResolvers = void 0;
const graphql_1 = require("graphql");
const appwrite_service_1 = require("./appwrite-service");
const auth_service_1 = require("./auth.service");
const api_server_service_1 = require("./api-server.service");
const helpers_1 = require("./helpers");
const defaultResolver = (payload, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let recodedTokensForApi;
    const { req } = context;
    const query = req.body.query;
    const parsedQuery = (0, graphql_1.parse)(query);
    const jwtToken = req.headers.authorization;
    let jwtTokenData;
    if (jwtToken) {
        jwtTokenData = auth_service_1.authService.verifyJwt(jwtToken);
        if (!jwtTokenData.userId)
            throw new Error('UserId missing from JWT');
        recodedTokensForApi = auth_service_1.authService.recodeProxyTokensDataToAPITokens(jwtTokenData);
    }
    const response = yield api_server_service_1.apiServerService.sendPostGraphQLRequest({
        query,
    }, recodedTokensForApi === null || recodedTokensForApi === void 0 ? void 0 : recodedTokensForApi.accessToken);
    (0, helpers_1.handleGraphQLErrorsFromAPI)(response);
    for (const prop in (_a = response === null || response === void 0 ? void 0 : response.data) !== null && _a !== void 0 ? _a : {}) {
        if (response === null || response === void 0 ? void 0 : response.data[prop].accessToken) {
            const { accessToken, refreshToken } = auth_service_1.authService.recodeAPITokensDataToProxyTokens({
                accessToken: response === null || response === void 0 ? void 0 : response.data[prop].accessToken,
                refreshToken: response === null || response === void 0 ? void 0 : response.data[prop].refreshToken,
            }, jwtTokenData);
            response.data[prop].accessToken = accessToken;
            response.data[prop].refreshToken = refreshToken;
        }
    }
    const firstPropOfData = Object.keys((_b = response === null || response === void 0 ? void 0 : response.data) !== null && _b !== void 0 ? _b : {})[0];
    if (firstPropOfData)
        return response.data[firstPropOfData];
    return response.data;
});
const wrapResolvers = (resolvers) => {
    return new Proxy(resolvers, {
        get(target, prop, receiver) {
            if (prop in target) {
                return Reflect.get(target, prop, receiver);
            }
            else {
                return defaultResolver;
            }
        },
    });
};
exports.wrapResolvers = wrapResolvers;
exports.resolvers = {
    signup(payload) {
        return auth_service_1.authService.signup(payload.input);
    },
    verify(payload, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const { input } = payload;
            const { req } = context;
            const jwtToken = req.headers.authorization;
            if (!jwtToken)
                throw new Error('No token provided');
            const jwtTokenData = auth_service_1.authService.verifyJwt(jwtToken);
            if (!jwtTokenData.userId)
                throw new Error('Invalid token');
            let { accessToken, refreshToken } = yield auth_service_1.authService.verify({
                phoneNumber: jwtTokenData.phoneNumber,
                code: input.code,
            });
            const decodedApiData = auth_service_1.authService.decodeApiTokensData(accessToken);
            const user = yield appwrite_service_1.appwriteService.createOrUpdateUser(decodedApiData.userId, jwtTokenData.phoneNumber);
            // const session = await authService.createSessionForUser(decodedApiData.userId);
            const recodedTokens = auth_service_1.authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { userId: user.$id, phoneNumber: jwtTokenData.phoneNumber });
            return { accessToken: recodedTokens.accessToken, refreshToken };
        });
    },
    refreshTokens(payload, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const { req } = context;
            const jwtToken = payload.input.refreshToken;
            if (!jwtToken)
                throw new Error('No token provided');
            const jwtTokenData = auth_service_1.authService.verifyRefreshJwt(jwtToken);
            if (!(payload === null || payload === void 0 ? void 0 : payload.input.refreshToken))
                throw new Error('No refresh token provided');
            console.log('REFRESH TOKEN THAT I SENT: ', payload.input.refreshToken);
            const { refreshToken: refreshTokenForAPI } = auth_service_1.authService.recodeProxyTokensDataToAPITokens(jwtTokenData);
            console.log('RECODED REFRESH TOKEN', refreshTokenForAPI);
            let { accessToken, refreshToken } = yield auth_service_1.authService.refreshTokens(refreshTokenForAPI);
            const recodedTokens = auth_service_1.authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
            return { accessToken: recodedTokens.accessToken, refreshToken };
        });
    },
};
