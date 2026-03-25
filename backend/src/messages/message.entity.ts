import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  room_id: string;

  @Column({ nullable: true })
  sender_id: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  reply_to: string;

  @Column({ default: false })
  is_edited: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'reply_to' })
  replyMessage: Message;

  @CreateDateColumn()
  created_at: Date;
}
