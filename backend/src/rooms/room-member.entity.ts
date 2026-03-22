import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from './room.entity';

@Entity('room_members')
export class RoomMember {
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

  @Column({ default: false })
  is_admin: boolean;

  @CreateDateColumn()
  joined_at: Date;
}