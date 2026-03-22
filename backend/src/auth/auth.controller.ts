import { Controller, Post, Get, Body, Request, UseGuards, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }
  @UseGuards(JwtAuthGuard)
@Post('change-password')
changePassword(@Request() req, @Body() body: { oldPassword: string; newPassword: string }) {
  return this.authService.changePassword(req.user.sub, body.oldPassword, body.newPassword);
}

@UseGuards(JwtAuthGuard)
@Delete('account')
deleteAccount(@Request() req) {
  return this.authService.deleteAccount(req.user.sub);
}

@Post('reset-password')
resetPassword(@Body() body: { email: string; newPassword: string }) {
  return this.authService.resetPassword(body.email, body.newPassword);
}
}