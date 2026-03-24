import { Entity, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, Column } from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from './room.entity';

@Entity('room_bans')
export class RoomBan {
  @PrimaryColumn()
  room_id: string;

  @PrimaryColumn()
  user_id: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  banned_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'banned_by' })
  banner: User;

  @CreateDateColumn()
  created_at: Date;
}