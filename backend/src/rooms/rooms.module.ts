import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './room.entity';
import { RoomMember } from './room-member.entity';
import { RoomBan } from './room-ban.entity';
import { User } from '../users/user.entity';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomMember, RoomBan, User]), MessagesModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}