import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { PersonalChat } from './personal-chat.entity';
import { PersonalMessage } from './personal-message.entity';
import { Friend } from '../friends/friend.entity';
import { UserBan } from '../friends/user-ban.entity';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonalChat, PersonalMessage, Friend, UserBan]),
    MessagesModule,
  ],
  controllers: [PersonalController],
  providers: [PersonalService],
  exports: [PersonalService],
})
export class PersonalModule {}
