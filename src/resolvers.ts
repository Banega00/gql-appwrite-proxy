import { authService } from './auth.service';
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
    if (!jwtTokenData.sessionSecret) throw new Error('Invalid token');

    const { accessToken, refreshToken } = await authService.verify({
      phoneNumber: jwtTokenData.phoneNumber,
      code: input.code,
      sessionSecret: jwtTokenData.sessionSecret,
    });

    return authService.recodeAPITokens({ accessToken, refreshToken }, { sessionSecret: jwtTokenData.sessionSecret, userId: jwtTokenData.userId, phoneNumber: jwtTokenData.phoneNumber });
  },
};
