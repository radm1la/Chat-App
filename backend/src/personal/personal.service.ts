import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalChat } from './personal-chat.entity';
import { PersonalMessage } from './personal-message.entity';
import { Friend } from '../friends/friend.entity';
import { UserBan } from '../friends/user-ban.entity';
import { ChatGateway } from '../messages/chat.gateway';

@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(PersonalChat)
    private chatsRepo: Repository<PersonalChat>,
    @InjectRepository(PersonalMessage)
    private messagesRepo: Repository<PersonalMessage>,
    @InjectRepository(Friend)
    private friendsRepo: Repository<Friend>,
    @InjectRepository(UserBan)
    private bansRepo: Repository<UserBan>,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async getOrCreateChat(userId: string, targetId: string) {
    const isFriend = await this.friendsRepo.findOne({
      where: [
        { sender_id: userId, receiver_id: targetId, status: 'accepted' },
        { sender_id: targetId, receiver_id: userId, status: 'accepted' },
      ],
    });
    if (!isFriend)
      throw new ForbiddenException('You must be friends to message');

    const banned = await this.bansRepo.findOne({
      where: [
        { banner_id: userId, banned_id: targetId },
        { banner_id: targetId, banned_id: userId },
      ],
    });
    if (banned) throw new ForbiddenException('Cannot message this user');

    let chat = await this.chatsRepo.findOne({
      where: [
        { user1_id: userId, user2_id: targetId },
        { user1_id: targetId, user2_id: userId },
      ],
    });

    if (!chat) {
      chat = this.chatsRepo.create({ user1_id: userId, user2_id: targetId });
      await this.chatsRepo.save(chat);
    }

    return chat;
  }

  async getMyChats(userId: string) {
    return this.chatsRepo.find({
      where: [{ user1_id: userId }, { user2_id: userId }],
      relations: ['user1', 'user2'],
    });
  }

  async getMessages(chatId: string, userId: string, page = 1, limit = 50) {
    const chat = await this.chatsRepo.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.user1_id !== userId && chat.user2_id !== userId) {
      throw new ForbiddenException('Not your chat');
    }

    const [messages, total] = await this.messagesRepo.findAndCount({
      where: { chat_id: chatId, is_deleted: false },
      relations: ['sender', 'replyMessage', 'replyMessage.sender'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { messages: messages.reverse(), total, page };
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    replyTo?: string,
  ) {
    const chat = await this.chatsRepo.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.user1_id !== senderId && chat.user2_id !== senderId) {
      throw new ForbiddenException('Not your chat');
    }

    const banned = await this.bansRepo.findOne({
      where: [
        { banner_id: chat.user1_id, banned_id: chat.user2_id },
        { banner_id: chat.user2_id, banned_id: chat.user1_id },
      ],
    });
    if (banned) throw new ForbiddenException('Cannot message this user');

    const message = this.messagesRepo.create({
      chat_id: chatId,
      sender_id: senderId,
      content,
      reply_to: replyTo,
    });

    await this.messagesRepo.save(message);

    const savedMessage = await this.messagesRepo.findOne({
      where: { id: message.id },
      relations: ['sender', 'replyMessage', 'replyMessage.sender'],
    });

    this.chatGateway.emitPersonalMessage(
      chat.user1_id,
      chat.user2_id,
      savedMessage,
    );

    return savedMessage;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.messagesRepo.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== userId)
      throw new ForbiddenException('Not your message');

    message.content = content;
    message.is_edited = true;
    await this.messagesRepo.save(message);
    return message;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messagesRepo.findOne({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== userId)
      throw new ForbiddenException('Not your message');

    const chat = await this.chatsRepo.findOne({
      where: { id: message.chat_id },
    });

    message.is_deleted = true;
    await this.messagesRepo.save(message);

    if (chat) {
      this.chatGateway.emitPersonalMessageDeleted(
        chat.user1_id,
        chat.user2_id,
        messageId,
      );
    }

    return { message: 'Deleted' };
  }
}
