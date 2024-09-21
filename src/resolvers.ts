import { GraphQLError, GraphQLFieldResolver, parse } from 'graphql';
import { appwriteService } from './appwrite-service';
import { authService, ProxyJWTPayload } from './auth.service';
import { RefreshTokensInput } from './dto/refresh-token-input.dto';
import { SignupInput } from './dto/sign-up-input.dto';
import { VerifyInput } from './dto/verify.dto';
import { Context } from './types';
import { venueService } from './services/venue.service';
import { groupService, GroupService } from './services/group.service';
import { apiServerService } from './api-server.service';
import { handleGraphQLErrorsFromAPI } from './helpers';

const defaultResolver = async (payload: any, context: Context) => {
  let recodedTokensForApi;
  const { req } = context;

  const query = req.body.query;
  const parsedQuery = parse(query);

  const jwtToken = req.headers.authorization;
  let jwtTokenData: ProxyJWTPayload | undefined;
  if (jwtToken) {
    jwtTokenData = authService.verifyJwt(jwtToken);
    if (!jwtTokenData.userId) throw new Error('UserId missing from JWT');

    recodedTokensForApi = authService.recodeProxyTokensDataToAPITokens(jwtTokenData);
  }

  const response = await apiServerService.sendPostGraphQLRequest(
    {
      query,
    },
    recodedTokensForApi?.accessToken
  );

  handleGraphQLErrorsFromAPI(response);

  for (const prop in response?.data ?? {}) {
    if (response?.data[prop].accessToken) {
      const { accessToken, refreshToken } = authService.recodeAPITokensDataToProxyTokens(
        {
          accessToken: response?.data[prop].accessToken,
          refreshToken: response?.data[prop].refreshToken,
        },
        jwtTokenData
      );

      response.data[prop].accessToken = accessToken;
      response.data[prop].refreshToken = refreshToken;
    }
  }

  const firstPropOfData = Object.keys(response?.data ?? {})[0];

  if (firstPropOfData) return response.data[firstPropOfData];

  return response.data;
};

export const wrapResolvers = (resolvers: any) => {
  return new Proxy(resolvers, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      } else {
        return defaultResolver;
      }
    },
  });
};

export const resolvers = {
  signup(payload: { input: SignupInput }) {
    return authService.signup(payload.input);
  },

  async verify(payload: { input: VerifyInput }, context: Context) {
    const { input } = payload;
    const { req } = context;
    const jwtToken = req.headers.authorization;
    if (!jwtToken) throw new Error('No token provided');
    const jwtTokenData = authService.verifyJwt(jwtToken);
    if (!jwtTokenData.userId) throw new Error('Invalid token');

    let { accessToken, refreshToken } = await authService.verify({
      phoneNumber: jwtTokenData.phoneNumber,
      code: input.code,
    });
    const decodedApiData = authService.decodeApiTokensData(accessToken);

    const user = await appwriteService.createOrUpdateUser(decodedApiData.userId, jwtTokenData.phoneNumber);
    // const session = await authService.createSessionForUser(decodedApiData.userId);

    const recodedTokens = authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { userId: user.$id, phoneNumber: jwtTokenData.phoneNumber });
    return { accessToken: recodedTokens.accessToken, refreshToken };
  },

  async refreshTokens(payload: { input: RefreshTokensInput }, context: Context) {
    const { req } = context;
    const jwtToken = payload.input.refreshToken;
    if (!jwtToken) throw new Error('No token provided');
    const jwtTokenData = authService.verifyRefreshJwt(jwtToken);

    if (!payload?.input.refreshToken) throw new Error('No refresh token provided');

    console.log('REFRESH TOKEN THAT I SENT: ', payload.input.refreshToken);

    const { refreshToken: refreshTokenForAPI } = authService.recodeProxyTokensDataToAPITokens(jwtTokenData);

    console.log('RECODED REFRESH TOKEN', refreshTokenForAPI);

    let { accessToken, refreshToken } = await authService.refreshTokens(refreshTokenForAPI);

    const recodedTokens = authService.recodeAPITokensDataToProxyTokens({ accessToken, refreshToken }, { userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
    return { accessToken: recodedTokens.accessToken, refreshToken };
  },
};
