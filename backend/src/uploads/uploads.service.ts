import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import { RoomMember } from '../rooms/room-member.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepo: Repository<Attachment>,
    @InjectRepository(RoomMember)
    private membersRepo: Repository<RoomMember>,
  ) {}

  async uploadFile(userId: string, roomId: string, file: Express.Multer.File) {
    const member = await this.membersRepo.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    if (!member) throw new ForbiddenException('Not a member of this room');

    const attachment = this.attachmentsRepo.create({
      file_name: file.originalname,
      file_path: `/uploads/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: userId,
      room_id: roomId,
    });

    await this.attachmentsRepo.save(attachment);
    return attachment;
  }

  async getFile(fileId: string, userId: string) {
    const attachment = await this.attachmentsRepo.findOne({
      where: { id: fileId },
    });
    if (!attachment) throw new NotFoundException('File not found');

    if (attachment.room_id) {
      const member = await this.membersRepo.findOne({
        where: { room_id: attachment.room_id, user_id: userId },
      });
      if (!member) throw new ForbiddenException('No access to this file');
    }

    return attachment;
  }

  async deleteFile(fileId: string, userId: string) {
    const attachment = await this.attachmentsRepo.findOne({
      where: { id: fileId, uploaded_by: userId },
    });
    if (!attachment) throw new NotFoundException('File not found');

    const filePath = path.join(process.cwd(), 'public', attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.attachmentsRepo.delete(fileId);
    return { message: 'File deleted' };
  }

  async uploadPersonalFile(
    userId: string,
    chatId: string,
    file: Express.Multer.File,
  ) {
    const attachment = this.attachmentsRepo.create({
      file_name: file.originalname,
      file_path: `/uploads/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: userId,
    });

    await this.attachmentsRepo.save(attachment);
    return attachment;
  }
}
