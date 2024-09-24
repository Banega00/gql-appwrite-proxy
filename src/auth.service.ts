import { apiServerService } from './api-server.service';
import { appwriteService } from './appwrite-service';
import * as jwt from 'jsonwebtoken';
import { Context } from './types';
import { GraphQLError } from 'graphql';
import { handleGraphQLErrorsFromAPI } from './helpers';
import { SignupInput } from './dto/sign-up-input.dto';
import { SignupResponse } from './dto/sign-up-response.dto';
import { VerifyResponse } from './dto/verify-response.dto';
import { RefreshTokensResponse } from './dto/refresh-token-response.dto';
import { VenueDTO } from './dto/venue.dto';
import { UserRole } from './utils/user-role.enum';

export interface ProxyJWTPayload {
  userId: string;
  phoneNumber: string;
  groupId?: string;
  venuesId?: string[];
}

export interface APIAccessTokenData {
  userId: string;
  phoneNumber: string;
  groupId?: string;
  venuesId?: string[];
  exp: number;
  iat: number;
}
export class AuthService {
  decodeApiTokensData = (accessToken: string) => jwt.decode(accessToken) as APIAccessTokenData;

  recodeAPITokensDataToProxyTokens(apiTokens: { accessToken: string; refreshToken: string }, proxyTokenData?: ProxyJWTPayload) {
    const apiAccessTokenData = this.decodeApiTokensData(apiTokens.accessToken);

    const payloadForTokens = {
      ...(proxyTokenData ?? {}),
      ...apiAccessTokenData,
    };

    return this.createTokens(payloadForTokens);
  }

  recodeProxyTokensDataToAPITokens(proxyTokensData: ProxyJWTPayload) {
    const apiTokens = this.createTokens(proxyTokensData, 'api');
    return apiTokens;
  }

  constructor() {}

  async signup(input: SignupInput) {
    let user = await appwriteService.getUserByPhoneNumber(input.phoneNumber);

    if (!user) {
      user = await appwriteService.createUser(input);
    }

    const responseData = await apiServerService.sendPostGraphQLRequest<{ signup: SignupResponse }>({
      query: `mutation Signup {
        signup(input: { phoneNumber: "${input.phoneNumber}", userId: "${user.$id}", role: ${input.role} }) {
          accessToken
          refreshToken
          code
          }
          }`,
    });

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData?.data?.signup) {
      throw new Error('Error signing up');
    } else {
      const session = await appwriteService.createAnonymousSession();
      const tokens = this.createTokens({ userId: session.userId, phoneNumber: input.phoneNumber });
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, code: responseData.data.signup.code };
    }
  }

  async verify(obj: { phoneNumber: string; code: string; role: UserRole }) {
    const { phoneNumber, code } = obj;

    const responseData = await apiServerService.sendPostGraphQLRequest<{ verify: VerifyResponse }>({
      query: `mutation Verify {
      verify(input: { phoneNumber: "${phoneNumber}", role: ${obj.role}, code: "${code}" }) {
          accessToken
          refreshToken
      }
  }
  `,
    });

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData.data.verify) {
      throw new Error('Error verifying');
    } else {
      return responseData.data.verify;
    }
  }

  async createSessionForUser(userId: string) {
    return appwriteService.createSessionForUser(userId);
  }

  createTokens(payload?: any, forServer: 'api' | 'proxy' = 'proxy') {
    const accessToken = this.createAccessToken(payload, forServer);

    const refreshToken = this.createRefreshToken(payload, forServer);

    return { accessToken, refreshToken };
  }

  createAccessToken(payload?: any, forServer: 'api' | 'proxy' = 'proxy') {
    const secret = forServer === 'api' ? process.env.API_ACCESS_TOKEN_SECRET : process.env.ACCESS_TOKEN_SECRET;
    const options = payload?.exp && payload?.iat ? {} : { expiresIn: '10m' };
    return jwt.sign(payload ?? {}, secret!, options);
  }

  createRefreshToken(payload?: any, forServer: 'api' | 'proxy' = 'proxy') {
    const secret = forServer === 'api' ? process.env.API_REFRESH_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET;
    const options = payload?.exp && payload?.iat ? {} : { expiresIn: '480m' };
    return jwt.sign(payload ?? {}, secret!, options);
  }

  verifyJwt(jwtToken: string) {
    const splitted = jwtToken.split(' ');
    const token = splitted[1] ?? splitted[0];
    try {
      const data: ProxyJWTPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as ProxyJWTPayload;
      if (!data.userId) throw new Error('Invalid token');
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  verifyRefreshJwt(jwtToken: string) {
    const splitted = jwtToken.split(' ');
    const token = splitted[1] ?? splitted[0];
    try {
      const data: ProxyJWTPayload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as ProxyJWTPayload;
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async refreshTokens(refreshToken: string) {
    const responseData = await apiServerService.sendPostGraphQLRequest<{ refreshTokens: RefreshTokensResponse }>(
      {
        query: `mutation RefreshTokens {
      refreshTokens(input: { refreshToken: "${refreshToken}"}) {
          accessToken
          refreshToken
      }
  }
  `,
      },
      `Bearer ${refreshToken}`
    );

    console.log('RESPONSE FROM SERVER: ', responseData);

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData.data.refreshTokens) {
      console.log(responseData);
      throw new Error('Error refresh tokens');
    } else {
      return responseData.data.refreshTokens;
    }
  }
}
export const authService = new AuthService();
