import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateRoomDto, InviteUserDto } from './rooms.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  createRoom(@Request() req, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.sub, dto);
  }

  @Get('public')
  getPublicRooms(@Query('search') search?: string) {
    return this.roomsService.getPublicRooms(search);
  }

  @Get('my')
  getUserRooms(@Request() req) {
    return this.roomsService.getUserRooms(req.user.sub);
  }

  @Post(':id/join')
  joinRoom(@Request() req, @Param('id') roomId: string) {
    return this.roomsService.joinRoom(req.user.sub, roomId);
  }

  @Post(':id/leave')
  leaveRoom(@Request() req, @Param('id') roomId: string) {
    return this.roomsService.leaveRoom(req.user.sub, roomId);
  }

  @Get(':id/members')
  getMembers(@Param('id') roomId: string) {
    return this.roomsService.getRoomMembers(roomId);
  }

  @Post(':id/invite')
  inviteUser(
    @Request() req,
    @Param('id') roomId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.roomsService.inviteUser(roomId, req.user.sub, dto);
  }

  @Post(':id/ban/:userId')
  banMember(
    @Request() req,
    @Param('id') roomId: string,
    @Param('userId') targetId: string,
  ) {
    return this.roomsService.banMember(roomId, req.user.sub, targetId);
  }

  @Delete(':id')
  deleteRoom(@Request() req, @Param('id') roomId: string) {
    return this.roomsService.deleteRoom(roomId, req.user.sub);
  }

  @Get(':id/banned')
  getBannedUsers(@Param('id') roomId: string) {
    return this.roomsService.getBannedUsers(roomId);
  }

  @Delete(':id/ban/:userId')
  unbanMember(
    @Request() req,
    @Param('id') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.roomsService.unbanMember(roomId, req.user.sub, userId);
  }

  @Post(':id/admin/:userId')
  makeAdmin(
    @Request() req,
    @Param('id') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.roomsService.makeAdmin(roomId, req.user.sub, userId);
  }

  @Delete(':id/admin/:userId')
  removeAdmin(
    @Request() req,
    @Param('id') roomId: string,
    @Param('userId') userId: string,
  ) {
    return this.roomsService.removeAdmin(roomId, req.user.sub, userId);
  }
}
