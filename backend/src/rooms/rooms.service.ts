import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { RoomMember } from './room-member.entity';
import { RoomBan } from './room-ban.entity';
import { User } from '../users/user.entity';
import { CreateRoomDto, InviteUserDto } from './rooms.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepo: Repository<Room>,
    @InjectRepository(RoomMember)
    private membersRepo: Repository<RoomMember>,
    @InjectRepository(RoomBan)
    private bansRepo: Repository<RoomBan>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async createRoom(userId: string, dto: CreateRoomDto) {
    const existing = await this.roomsRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Room name already taken');

    const room = this.roomsRepo.create({
      ...dto,
      owner_id: userId,
    });
    await this.roomsRepo.save(room);

    await this.membersRepo.save({
      room_id: room.id,
      user_id: userId,
      is_admin: true,
    });

    return room;
  }

  async getPublicRooms(search?: string) {
    const query = this.roomsRepo
      .createQueryBuilder('room')
      .loadRelationCountAndMap('room.memberCount', 'room.members')
      .where('room.is_private = false');

    if (search) {
      query.andWhere('room.name ILIKE :search', { search: `%${search}%` });
    }

    return query.getMany();
  }

  async joinRoom(userId: string, roomId: string) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.is_private) throw new ForbiddenException('Room is private');

    const banned = await this.bansRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (banned) throw new ForbiddenException('You are banned from this room');

    const existing = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (existing) throw new ConflictException('Already a member');

    await this.membersRepo.save({ room_id: roomId, user_id: userId });
    return { message: 'Joined successfully' };
  }

  async leaveRoom(userId: string, roomId: string) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id === userId)
      throw new ForbiddenException('Owner cannot leave the room');

    await this.membersRepo.delete({ room_id: roomId, user_id: userId });
    return { message: 'Left successfully' };
  }

  async getRoomMembers(roomId: string) {
    return this.membersRepo.find({
      where: { room_id: roomId },
      relations: ['user'],
    });
  }

  async inviteUser(roomId: string, inviterId: string, dto: InviteUserDto) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const member = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: inviterId },
    });
    if (!member)
      throw new ForbiddenException('You are not a member of this room');

    const user = await this.usersRepo.findOne({
      where: { username: dto.username },
    });
    if (!user) throw new NotFoundException('User not found');

    const banned = await this.bansRepo.findOne({
      where: { room_id: roomId, user_id: user.id },
    });
    if (banned) throw new ForbiddenException('User is banned from this room');

    const existing = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: user.id },
    });
    if (existing) throw new ConflictException('User is already a member');

    await this.membersRepo.save({ room_id: roomId, user_id: user.id });
    return { message: 'User invited successfully' };
  }

  async banMember(roomId: string, adminId: string, targetUserId: string) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const admin = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: adminId },
    });
    if (!admin || !admin.is_admin) throw new ForbiddenException('Not an admin');

    await this.membersRepo.delete({ room_id: roomId, user_id: targetUserId });
    await this.bansRepo.save({
      room_id: roomId,
      user_id: targetUserId,
      banned_by: adminId,
    });
    return { message: 'User banned' };
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== userId)
      throw new ForbiddenException('Only owner can delete the room');

    await this.roomsRepo.delete(roomId);
    return { message: 'Room deleted' };
  }

  async getUserRooms(userId: string) {
    return this.membersRepo.find({
      where: { user_id: userId },
      relations: ['room'],
    });
  }

  async getBannedUsers(roomId: string) {
    return this.bansRepo.find({
      where: { room_id: roomId },
      relations: ['user', 'banner'],
    });
  }

  async unbanMember(roomId: string, adminId: string, targetUserId: string) {
    const admin = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: adminId },
    });
    if (!admin || !admin.is_admin) throw new ForbiddenException('Not an admin');

    await this.bansRepo.delete({ room_id: roomId, user_id: targetUserId });

    const existing = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: targetUserId },
    });
    if (!existing) {
      await this.membersRepo.save({ room_id: roomId, user_id: targetUserId });
    }

    return { message: 'User unbanned' };
  }

  async makeAdmin(roomId: string, ownerId: string, targetUserId: string) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== ownerId)
      throw new ForbiddenException('Only owner can make admins');

    await this.membersRepo.update(
      { room_id: roomId, user_id: targetUserId },
      { is_admin: true },
    );
    return { message: 'Admin added' };
  }

  async removeAdmin(roomId: string, ownerId: string, targetUserId: string) {
    const room = await this.roomsRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== ownerId)
      throw new ForbiddenException('Only owner can remove admins');

    await this.membersRepo.update(
      { room_id: roomId, user_id: targetUserId },
      { is_admin: false },
    );
    return { message: 'Admin removed' };
  }
}
