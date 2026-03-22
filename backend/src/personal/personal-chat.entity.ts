import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('personal_chats')
export class PersonalChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user1_id: string;

  @Column()
  user2_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user1_id' })
  user1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user2_id' })
  user2: User;

  @CreateDateColumn()
  created_at: Date;
}