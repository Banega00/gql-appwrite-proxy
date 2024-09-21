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
exports.resolvers = void 0;
const appwrite_service_1 = require("./appwrite-service");
const auth_service_1 = require("./auth.service");
exports.resolvers = {
    health() {
        return 'health+1+2+3';
    },
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
            if (!jwtTokenData.session)
                throw new Error('Invalid token');
            let { accessToken, refreshToken } = yield auth_service_1.authService.verify({
                phoneNumber: jwtTokenData.phoneNumber,
                code: input.code,
                session: jwtTokenData.session,
            });
            const decodedApiData = auth_service_1.authService.decodeApiTokensData(accessToken);
            const session = yield appwrite_service_1.appwriteService.createOrUpdateUserFromSession(decodedApiData.userId, jwtTokenData.session, jwtTokenData.phoneNumber);
            // const session = await authService.createSessionForUser(decodedApiData.userId);
            const recodedTokens = auth_service_1.authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { session: session.secret, userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
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
            const { refreshToken: refreshTokenForAPI } = auth_service_1.authService.recodeProxyTokensDataToAPITokens(jwtTokenData);
            let { accessToken, refreshToken } = yield auth_service_1.authService.refreshTokens(refreshTokenForAPI);
            const session = yield auth_service_1.authService.createSessionForUser(jwtTokenData.userId);
            const recodedTokens = auth_service_1.authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { session: session.secret, userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
            return { accessToken: recodedTokens.accessToken, refreshToken };
        });
    },
    venue(_, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const { req } = context;
            const jwtToken = req.headers.authorization;
            if (!jwtToken)
                throw new Error('No token provided');
            const jwtTokenData = auth_service_1.authService.verifyJwt(jwtToken);
            if (!jwtTokenData.session)
                throw new Error('Session secret missing from token');
            yield appwrite_service_1.appwriteService.checkUserSession(jwtTokenData.session);
            const apiTokens = auth_service_1.authService.recodeProxyTokensDataToAPITokens(jwtTokenData);
            const response = yield auth_service_1.authService.getVenuesForEmployeeOrGroup(apiTokens.accessToken);
            return response;
        });
    },
};
