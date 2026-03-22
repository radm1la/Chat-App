import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { User } from './users/user.entity';
import { Room } from './rooms/room.entity';
import { RoomMember } from './rooms/room-member.entity';
import { RoomBan } from './rooms/room-ban.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Room, RoomMember, RoomBan],
      synchronize: false,
    }),
    AuthModule,
    RoomsModule,
  ],
})
export class AppModule {}