import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('user_bans')
export class UserBan {
  @PrimaryColumn()
  banner_id: string;

  @PrimaryColumn()
  banned_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'banner_id' })
  banner: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'banned_id' })
  banned: User;

  @CreateDateColumn()
  created_at: Date;
}