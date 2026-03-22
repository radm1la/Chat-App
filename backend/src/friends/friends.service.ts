import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { UserBan } from './user-ban.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendsRepo: Repository<Friend>,
    @InjectRepository(UserBan)
    private bansRepo: Repository<UserBan>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async sendRequest(senderId: string, username: string) {
    const receiver = await this.usersRepo.findOne({ where: { username } });
    if (!receiver) throw new NotFoundException('User not found');
    if (receiver.id === senderId) throw new ForbiddenException('Cannot add yourself');

    const banned = await this.bansRepo.findOne({
      where: [
        { banner_id: senderId, banned_id: receiver.id },
        { banner_id: receiver.id, banned_id: senderId },
      ]
    });
    if (banned) throw new ForbiddenException('Cannot send request');

    const existing = await this.friendsRepo.findOne({
      where: [
        { sender_id: senderId, receiver_id: receiver.id },
        { sender_id: receiver.id, receiver_id: senderId },
      ]
    });
    if (existing) throw new ConflictException('Request already exists');

    const request = this.friendsRepo.create({
      sender_id: senderId,
      receiver_id: receiver.id,
      status: 'pending',
    });

    await this.friendsRepo.save(request);
    return { message: 'Friend request sent' };
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.friendsRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.receiver_id !== userId) throw new ForbiddenException('Not your request');

    request.status = 'accepted';
    await this.friendsRepo.save(request);
    return { message: 'Friend request accepted' };
  }

  async declineRequest(userId: string, requestId: string) {
    const request = await this.friendsRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.receiver_id !== userId) throw new ForbiddenException('Not your request');

    await this.friendsRepo.delete(requestId);
    return { message: 'Friend request declined' };
  }

  async getFriends(userId: string) {
    const friends = await this.friendsRepo.find({
      where: [
        { sender_id: userId, status: 'accepted' },
        { receiver_id: userId, status: 'accepted' },
      ],
      relations: ['sender', 'receiver'],
    });

    return friends.map(f => {
      const friend = f.sender_id === userId ? f.receiver : f.sender;
      return {
        id: f.id,
        user: {
          id: friend.id,
          username: friend.username,
          avatar_url: friend.avatar_url,
        }
      };
    });
  }

  async getPendingRequests(userId: string) {
    return this.friendsRepo.find({
      where: { receiver_id: userId, status: 'pending' },
      relations: ['sender'],
    });
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.friendsRepo.findOne({
      where: [
        { sender_id: userId, receiver_id: friendId },
        { sender_id: friendId, receiver_id: userId },
      ]
    });
    if (!friendship) throw new NotFoundException('Friendship not found');

    await this.friendsRepo.delete(friendship.id);
    return { message: 'Friend removed' };
  }

  async banUser(userId: string, targetId: string) {
    const target = await this.usersRepo.findOne({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.bansRepo.findOne({
      where: { banner_id: userId, banned_id: targetId }
    });
    if (existing) throw new ConflictException('Already banned');

    await this.bansRepo.save({ banner_id: userId, banned_id: targetId });

    // Remove friendship if exists
    const friendship = await this.friendsRepo.findOne({
      where: [
        { sender_id: userId, receiver_id: targetId },
        { sender_id: targetId, receiver_id: userId },
      ]
    });
    if (friendship) await this.friendsRepo.delete(friendship.id);

    return { message: 'User banned' };
  }

  async unbanUser(userId: string, targetId: string) {
    await this.bansRepo.delete({ banner_id: userId, banned_id: targetId });
    return { message: 'User unbanned' };
  }

  async isBanned(userId: string, targetId: string) {
    const ban = await this.bansRepo.findOne({
      where: [
        { banner_id: userId, banned_id: targetId },
        { banner_id: targetId, banned_id: userId },
      ]
    });
    return !!ban;
  }
}