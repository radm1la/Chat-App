import { Controller, Post, Get, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('request')
  sendRequest(@Request() req, @Body() body: { username: string }) {
    return this.friendsService.sendRequest(req.user.sub, body.username);
  }

  @Post('accept/:id')
  acceptRequest(@Request() req, @Param('id') id: string) {
    return this.friendsService.acceptRequest(req.user.sub, id);
  }

  @Post('decline/:id')
  declineRequest(@Request() req, @Param('id') id: string) {
    return this.friendsService.declineRequest(req.user.sub, id);
  }

  @Get()
  getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.sub);
  }

  @Get('pending')
  getPendingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.sub);
  }

  @Delete(':id')
  removeFriend(@Request() req, @Param('id') friendId: string) {
    return this.friendsService.removeFriend(req.user.sub, friendId);
  }

  @Get('bans')
  getBannedUsers(@Request() req) {
    return this.friendsService.getBannedUsers(req.user.sub);
  }

  @Post('ban/:id')
  banUser(@Request() req, @Param('id') targetId: string) {
    return this.friendsService.banUser(req.user.sub, targetId);
  }

  @Delete('ban/:id')
  unbanUser(@Request() req, @Param('id') targetId: string) {
    return this.friendsService.unbanUser(req.user.sub, targetId);
  }
}