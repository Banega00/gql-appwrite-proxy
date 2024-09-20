import { authService } from './auth.service';
import { SignupInput } from './dto/signup-input.dto';
import { VerifyInput } from './dto';
import { Context } from './types';
import * as DTO from './dto';
export const resolvers = {
  health() {
    return 'health+1+2';
  },

  signup(payload: { input: DTO.SignupInput }) {
    return authService.signup(payload.input);
  },

  verify(payload: { input: VerifyInput }, context: Context) {
    const { input } = payload;
    const { req } = context;
    const jwtToken = req.headers.authorization;
    if (!jwtToken) throw new Error('No token provided');
    const jwtTokenData = authService.verifyJwt(jwtToken);
    if (!jwtTokenData.sessionSecret) throw new Error('Invalid token');

    return authService.verify({
      phoneNumber: jwtTokenData.phoneNumber,
      code: input.code,
      sessionSecret: jwtTokenData.sessionSecret,
    });
  },
};
