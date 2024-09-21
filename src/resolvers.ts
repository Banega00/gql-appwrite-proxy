import { GraphQLError } from 'graphql';
import { appwriteService } from './appwrite-service';
import { authService } from './auth.service';
import { RefreshTokensInput } from './dto/refresh-token-input.dto';
import { SignupInput } from './dto/sign-up-input.dto';
import { VerifyInput } from './dto/verify.dto';
import { Context } from './types';
export const resolvers = {
  health() {
    return 'health+1+2+3';
  },

  signup(payload: { input: SignupInput }) {
    return authService.signup(payload.input);
  },

  async verify(payload: { input: VerifyInput }, context: Context) {
    const { input } = payload;
    const { req } = context;
    const jwtToken = req.headers.authorization;
    if (!jwtToken) throw new Error('No token provided');
    const jwtTokenData = authService.verifyJwt(jwtToken);
    if (!jwtTokenData.session) throw new Error('Invalid token');

    let { accessToken, refreshToken } = await authService.verify({
      phoneNumber: jwtTokenData.phoneNumber,
      code: input.code,
      session: jwtTokenData.session,
    });

    const decodedApiData = authService.decodeApiTokensData(accessToken);

    const session = await appwriteService.createOrUpdateUserFromSession(decodedApiData.userId, jwtTokenData.session, jwtTokenData.phoneNumber);
    // const session = await authService.createSessionForUser(decodedApiData.userId);

    const recodedTokens = authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { session: session.secret, userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
    return { accessToken: recodedTokens.accessToken, refreshToken };
  },

  async refreshTokens(payload: { input: RefreshTokensInput }, context: Context) {
    const { req } = context;
    const jwtToken = payload.input.refreshToken;
    if (!jwtToken) throw new Error('No token provided');
    const jwtTokenData = authService.verifyRefreshJwt(jwtToken);

    if (!payload?.input.refreshToken) throw new Error('No refresh token provided');

    const { refreshToken: refreshTokenForAPI } = authService.recodeProxyTokensDataToAPITokens(jwtTokenData);

    let { accessToken, refreshToken } = await authService.refreshTokens(refreshTokenForAPI);

    const session = await authService.createSessionForUser(jwtTokenData.userId);

    const recodedTokens = authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { session: session.secret, userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
    return { accessToken: recodedTokens.accessToken, refreshToken };
  },

  async venue(_: any, context: Context) {
    const { req } = context;
    const jwtToken = req.headers.authorization;
    if (!jwtToken) throw new Error('No token provided');
    const jwtTokenData = authService.verifyJwt(jwtToken);

    if (!jwtTokenData.session) throw new Error('Session secret missing from token');

    await appwriteService.checkUserSession(jwtTokenData.session);

    const apiTokens = authService.recodeProxyTokensDataToAPITokens(jwtTokenData);

    const response = await authService.getVenuesForEmployeeOrGroup(apiTokens.accessToken);

    return response;
  },
};
