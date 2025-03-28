import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

export enum MessageType {
  TEXT = 'text',
  MEDIA = 'media',
  TOKEN_TRANSFER = 'token_transfer',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column('uuid')
  @Index()
  senderId: string;

  @Column('uuid')
  @Index()
  conversationId: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @Index()
  timestamp: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
