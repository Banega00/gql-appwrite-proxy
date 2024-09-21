import { UserDTO } from './user.dto';
import { VenueDTO } from './venue.dto';

export class GroupDTO {
  id: string;
  name: string;
  description: number;
  createdAt: Date;
  updatedAt: Date;
  users?: Partial<UserDTO>[];
  venues?: Partial<VenueDTO>[];
}
