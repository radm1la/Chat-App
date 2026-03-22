import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get(':roomId')
  getRoomMessages(
    @Param('roomId') roomId: string,
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.messagesService.getRoomMessages(roomId, req.user.sub, +page, +limit);
  }
}