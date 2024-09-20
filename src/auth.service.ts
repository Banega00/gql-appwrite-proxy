import { apiServerService } from './api-server.service';
import { appwriteService } from './appwrite-service';
import * as jwt from 'jsonwebtoken';
import { Context } from './types';
import { GraphQLError } from 'graphql';
import { handleGraphQLErrorsFromAPI } from './helpers';
import { VerifyResponse } from '../../src/auth/dto/verify-response.dto';
import { SignupResponse } from '../../src/auth/dto/sign-up-response.dto';
import { SignupInput } from '../../src/auth/dto/sign-up-input.dto';

export interface ProxyJWTPayload {
  sessionSecret: string;
  userId: string;
  phoneNumber: string;
}

export interface APIAccessTokenData {
  userId: string;
  phoneNumber: string;
  groupId?: string;
  venuesId?: string[];
  exp: number;
}
export class AuthService {
  recodeAPITokens(apiTokens: { accessToken: string; refreshToken: string }, proxyTokenData: ProxyJWTPayload) {
    const apiAccessTokenData = jwt.decode(apiTokens.accessToken) as any;

    const payloadForTokens = {
      ...proxyTokenData,
      exp: apiAccessTokenData.exp,
      iat: apiAccessTokenData.iat,
      ...apiAccessTokenData,
    };

    return this.createTokens(payloadForTokens);
  }
  constructor() {}

  async signup(input: SignupInput) {
    const session = await appwriteService.createOrSignInUser(input);

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
      const tokens = this.createTokens({ sessionSecret: session.secret, userId: session.userId, phoneNumber: input.phoneNumber });
      return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, code: responseData.data.signup.code };
    }
  }

  async verify(obj: { phoneNumber: string; code: string; sessionSecret: string }) {
    const { phoneNumber, code, sessionSecret } = obj;

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

  createTokens(payload?: any) {
    const accessToken = this.createAccessToken(payload);

    const refreshToken = this.createRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  createAccessToken(payload?: any) {
    return jwt.sign(payload ?? {}, process.env.ACCESS_TOKEN_SECRET!, {
      expiresIn: '10m',
    });
  }

  createRefreshToken(payload?: any) {
    return jwt.sign(payload ?? {}, process.env.REFRESH_TOKEN_SECRET!, {
      expiresIn: '480m',
    });
  }

  verifyJwt(jwtToken: string) {
    const splitted = jwtToken.split(' ');
    const token = splitted[1] ?? splitted[0];
    try {
      const data: ProxyJWTPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as ProxyJWTPayload;
      if (!data.sessionSecret) throw new Error('Invalid token');
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export const authService = new AuthService();
