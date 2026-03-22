import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  message_id: string;

  @Column()
  file_name: string;

  @Column()
  file_path: string;

  @Column()
  file_size: number;

  @Column({ nullable: true })
  mime_type: string;

  @Column({ nullable: true })
  uploaded_by: string;

  @Column({ nullable: true })
  room_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn()
  created_at: Date;
}