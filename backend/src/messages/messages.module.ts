import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ChatGateway } from './chat.gateway';
import { Message } from './message.entity';
import { RoomMember } from '../rooms/room-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, RoomMember]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
    }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, ChatGateway],
  exports: [MessagesService],
})
export class MessagesModule {}