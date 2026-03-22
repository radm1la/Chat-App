import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { RoomMember } from '../rooms/room-member.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepo: Repository<Message>,
    @InjectRepository(RoomMember)
    private membersRepo: Repository<RoomMember>,
  ) {}

  async getRoomMessages(roomId: string, userId: string, page = 1, limit = 50) {
    const member = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (!member) throw new ForbiddenException('Not a member of this room');

    const [messages, total] = await this.messagesRepo.findAndCount({
      where: { room_id: roomId, is_deleted: false },
      relations: ['sender'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { messages: messages.reverse(), total, page };
  }

  async saveMessage(roomId: string, senderId: string, content: string, replyTo?: string) {
    const member = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: senderId },
    });
    if (!member) throw new ForbiddenException('Not a member of this room');

    const message = this.messagesRepo.create({
      room_id: roomId,
      sender_id: senderId,
      content,
      reply_to: replyTo,
    });

    await this.messagesRepo.save(message);

    return this.messagesRepo.findOne({
      where: { id: message.id },
      relations: ['sender'],
    });
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.messagesRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== userId) throw new ForbiddenException('Not your message');

    message.content = content;
    message.is_edited = true;
    await this.messagesRepo.save(message);
    return message;
  }

  async deleteMessage(messageId: string, userId: string, roomId: string) {
    const message = await this.messagesRepo.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    const member = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });

    const isAdmin = member?.is_admin;
    const isOwner = message.sender_id === userId;

    if (!isAdmin && !isOwner) throw new ForbiddenException('Not allowed');

    message.is_deleted = true;
    await this.messagesRepo.save(message);
    return { message: 'Message deleted' };
  }
}