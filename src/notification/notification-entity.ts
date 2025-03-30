// src/notifications/entities/notification.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  Check,
} from 'typeorm';

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  MENTION = 'mention',
  TOKEN_RECEIVED = 'token_received',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index('idx_notifications_user_id') // Index for faster querying by user
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.NEW_MESSAGE,
  })
  @Index('idx_notifications_type') // Index for filtering by type
  type: NotificationType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', default: false })
  @Index('idx_notifications_is_read') // Index for filtering unread notifications
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index('idx_notifications_created_at') // Index for sorting by date
  createdAt: Date;

  // Composite index for common query pattern: get user's unread notifications
  @Index('idx_notifications_user_id_is_read')
  userIdAndIsRead: string;
}
