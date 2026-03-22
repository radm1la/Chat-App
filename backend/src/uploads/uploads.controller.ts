import { Controller, Post, Get, Delete, Param, Request, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Response } from 'express';
import * as path from 'path';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('room/:roomId')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './public/uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  }))
  uploadFile(
    @Request() req,
    @Param('roomId') roomId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadFile(req.user.sub, roomId, file);
  }

  @Get(':id')
  async getFile(
    @Param('id') fileId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const attachment = await this.uploadsService.getFile(fileId, req.user.sub);
    const filePath = path.join(process.cwd(), 'public', attachment.file_path);
    res.sendFile(filePath);
  }

  @Delete(':id')
  deleteFile(@Request() req, @Param('id') fileId: string) {
    return this.uploadsService.deleteFile(fileId, req.user.sub);
  }
}