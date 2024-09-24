import { Models } from 'node-appwrite';
import { UserRole } from './user-role.enum';

export interface AppwriteUserPreferences extends Models.Preferences {
  roles: UserRole[];
}
