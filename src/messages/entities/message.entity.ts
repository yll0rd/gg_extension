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

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column('uuid')
  @Index('idx_message_sender')
  senderId: string;

  @Column('uuid')
  @Index('idx_message_conversation')
  conversationId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @Index('idx_message_timestamp')
  timestamp: Date;

  // Optional: Additional metadata for media or token transfer
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;
}
