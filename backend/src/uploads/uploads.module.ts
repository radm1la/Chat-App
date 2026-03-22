import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { Attachment } from './attachment.entity';
import { RoomMember } from '../rooms/room-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, RoomMember])],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}