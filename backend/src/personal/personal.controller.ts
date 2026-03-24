import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { PersonalService } from './personal.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('personal')
@UseGuards(JwtAuthGuard)
export class PersonalController {
  constructor(private personalService: PersonalService) {}

  @Post('chat/:targetId')
  getOrCreateChat(@Request() req, @Param('targetId') targetId: string) {
    return this.personalService.getOrCreateChat(req.user.sub, targetId);
  }

  @Get('chats')
  getMyChats(@Request() req) {
    return this.personalService.getMyChats(req.user.sub);
  }

  @Get('chat/:chatId/messages')
  getMessages(
    @Param('chatId') chatId: string,
    @Request() req,
    @Query('page') page = 1,
  ) {
    return this.personalService.getMessages(chatId, req.user.sub, +page);
  }

  @Post('chat/:chatId/messages')
  sendMessage(
    @Param('chatId') chatId: string,
    @Request() req,
    @Body() body: { content: string; replyTo?: string },
  ) {
    return this.personalService.sendMessage(
      chatId,
      req.user.sub,
      body.content,
      body.replyTo,
    );
  }

  @Delete('message/:messageId')
  deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    return this.personalService.deleteMessage(messageId, req.user.sub);
  }

  @Patch('message/:messageId')
  editMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() body: { content: string },
  ) {
    return this.personalService.editMessage(
      messageId,
      req.user.sub,
      body.content,
    );
  }
}
