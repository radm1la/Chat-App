export class CreateRoomDto {
  name: string;
  description?: string;
  is_private?: boolean;
}

export class InviteUserDto {
  username: string;
}