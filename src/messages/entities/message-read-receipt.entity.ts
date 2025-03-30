import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_read_receipts')
export class MessageReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  messageId: string;

  @Column()
  @Index()
  userId: string;

  @CreateDateColumn()
  @Index()
  readAt: Date;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'messageId' })
  message: Message;
}
