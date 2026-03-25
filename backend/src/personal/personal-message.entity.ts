import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PersonalChat } from './personal-chat.entity';

@Entity('personal_messages')
export class PersonalMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chat_id: string;

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

  @ManyToOne(() => PersonalChat)
  @JoinColumn({ name: 'chat_id' })
  chat: PersonalChat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => PersonalMessage)
  @JoinColumn({ name: 'reply_to' })
  replyMessage: PersonalMessage;

  @CreateDateColumn()
  created_at: Date;
}
