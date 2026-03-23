import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
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

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
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

    await this.createSession(user.id, token, ipAddress || '', userAgent || '');

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

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) throw new UnauthorizedException('Old password is incorrect');

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string) {
    // Delete rooms owned by this user
    await this.usersRepository.query(`DELETE FROM rooms WHERE owner_id = $1`, [
      userId,
    ]);

    // Remove from all other rooms
    await this.usersRepository.query(
      `DELETE FROM room_members WHERE user_id = $1`,
      [userId],
    );

    // Delete the user
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

  async getSessions(userId: string) {
    return this.usersRepository.query(
      `SELECT id, token, ip_address, user_agent, created_at, expires_at 
     FROM sessions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
  }

  async createSession(
    userId: string,
    token: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.usersRepository.query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
     VALUES ($1, $2, $3, $4, $5)`,
      [userId, token, ipAddress, userAgent, expiresAt],
    );
  }

  async deleteSession(sessionId: string, userId: string) {
    await this.usersRepository.query(
      `DELETE FROM sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    return { message: 'Session deleted' };
  }
}
