import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException('Email or username already taken');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password_hash,
    });

    await this.usersRepository.save(user);

    return { message: 'Registered successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    return this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'avatar_url', 'created_at'],
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await this.usersRepository.findOne({ where: { id: userId } });
  if (!user) throw new UnauthorizedException('User not found');

  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) throw new UnauthorizedException('Old password is incorrect');

  user.password_hash = await bcrypt.hash(newPassword, 10);
  await this.usersRepository.save(user);
  return { message: 'Password changed successfully' };
}

async deleteAccount(userId: string) {
  await this.usersRepository.delete(userId);
  return { message: 'Account deleted' };
}

async resetPassword(email: string, newPassword: string) {
  const user = await this.usersRepository.findOne({ where: { email } });
  if (!user) throw new UnauthorizedException('Email not found');

  user.password_hash = await bcrypt.hash(newPassword, 10);
  await this.usersRepository.save(user);
  return { message: 'Password reset successfully' };
}
}