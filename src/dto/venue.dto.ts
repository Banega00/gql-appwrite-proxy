import { GroupDTO } from './group.dto';
import { UserDTO } from './user.dto';

export class VenueDTO {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  users?: Partial<UserDTO>[];
  group?: Partial<GroupDTO>;
}
