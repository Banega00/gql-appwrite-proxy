import { UserDTO } from './user.dto';

export class RefreshTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}
