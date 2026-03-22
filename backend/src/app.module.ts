import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { MessagesModule } from './messages/messages.module';
import { FriendsModule } from './friends/friends.module';
import { User } from './users/user.entity';
import { Room } from './rooms/room.entity';
import { RoomMember } from './rooms/room-member.entity';
import { RoomBan } from './rooms/room-ban.entity';
import { Message } from './messages/message.entity';
import { Friend } from './friends/friend.entity';
import { UserBan } from './friends/user-ban.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Room, RoomMember, RoomBan, Message, Friend, UserBan],
      synchronize: false,
    }),
    AuthModule,
    RoomsModule,
    MessagesModule,
    FriendsModule,
  ],
})
export class AppModule {}