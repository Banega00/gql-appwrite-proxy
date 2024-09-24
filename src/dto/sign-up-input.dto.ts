import { UserRole } from '../utils/user-role.enum';

export class SignupInput {
  phoneNumber: string;
  role: UserRole;
}
