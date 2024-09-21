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

export interface ProxyJWTPayload {
  session: string;
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

  recodeAPITokensDataToProxyTokens(apiTokens: { accessToken: string; refreshToken: string }, proxyTokenData: ProxyJWTPayload) {
    const apiAccessTokenData = this.decodeApiTokensData(apiTokens.accessToken);

    const payloadForTokens = {
      ...proxyTokenData,
      ...apiAccessTokenData,
    };

    console.log('PROXY TOKEN DATA', proxyTokenData);

    console.log('CREATING TOKENS WITH PAYLOAD', payloadForTokens);

    return this.createTokens(payloadForTokens);
  }

  recodeProxyTokensDataToAPITokens(proxyTokensData: ProxyJWTPayload) {
    const apiTokens = this.createTokens(proxyTokensData, 'api');
    return apiTokens;
  }

  constructor() {}

  async signup(input: SignupInput) {
    const responseData = await apiServerService.sendPostGraphQLRequest<{ signup: SignupResponse }>({
      query: `mutation Signup {
        signup(input: { phoneNumber: "${input.phoneNumber}" }) {
          accessToken
          refreshToken
          code
          }
          }`,
    });

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData?.data?.signup) {
      console.log(responseData);
      throw new Error('Error signing up');
    } else {
      const session = await appwriteService.createAnonymousSession();
      const tokens = this.createTokens({ session: session.secret, phoneNumber: input.phoneNumber });
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, code: responseData.data.signup.code };
    }
  }

  async verify(obj: { phoneNumber: string; code: string; session: string }) {
    const { phoneNumber, code, session } = obj;

    const responseData = await apiServerService.sendPostGraphQLRequest<{ verify: VerifyResponse }>({
      query: `mutation Verify {
      verify(input: { phoneNumber: "${phoneNumber}", code: "${code}" }) {
          accessToken
          refreshToken
      }
  }
  `,
    });

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData.data.verify) {
      console.log(responseData);
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
      if (!data.session) throw new Error('Invalid token');
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  verifyRefreshJwt(jwtToken: any) {
    console.log(jwtToken);
    const splitted = jwtToken.split(' ');
    const token = splitted[1] ?? splitted[0];
    try {
      const data: ProxyJWTPayload = jwt.verify(token, process.env.API_REFRESH_TOKEN_SECRET!) as ProxyJWTPayload;
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

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData.data.refreshTokens) {
      console.log(responseData);
      throw new Error('Error refresh tokens');
    } else {
      return responseData.data.refreshTokens;
    }
  }

  async getVenuesForEmployeeOrGroup(accessToken: string) {
    const responseData = await apiServerService.sendPostGraphQLRequest<{ venue: VenueDTO[] }>(
      {
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
      },
      `Bearer ${accessToken}`
    );

    handleGraphQLErrorsFromAPI(responseData);

    if (!responseData.data.venue) {
      console.log(responseData);
      throw new Error('Error getting venues');
    } else {
      return responseData.data.venue;
    }
  }
}

export const authService = new AuthService();
