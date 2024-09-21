import { GroupDTO } from './group.dto';
import { VenueDTO } from './venue.dto';

export class UserDTO {
  id: string;

  phoneNumber: string;

  createdAt: Date;
  externalId: string;
  updatedAt: Date;
  hashedRefreshToken: string;

  groups?: Partial<GroupDTO>[];

  venues?: Partial<VenueDTO>[];
}
