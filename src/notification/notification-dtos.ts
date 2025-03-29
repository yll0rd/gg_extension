// src/notifications/dto/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationPriority, NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID who will receive the notification' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.SYSTEM
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title', example: 'New Message' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification content', example: 'You have received a new message from John' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ 
    description: 'Notification priority',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
    example: NotificationPriority.MEDIUM
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.MEDIUM;

  @ApiPropertyOptional({ description: 'Related entity type', example: 'message' })
  @IsString()
  @IsOptional()
  relatedEntity?: string;

  @ApiPropertyOptional({ description: 'Related entity ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'URL to redirect when notification is clicked', example: '/messages/123' })
  @IsString()
  @IsOptional()
  actionUrl?: string;
}

// src/notifications/dto/update-notification.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiPropertyOptional({ description: 'Mark notification as read', example: true })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Mark notification as dismissed', example: false })
  @IsBoolean()
  @IsOptional()
  isDismissed?: boolean;
}

// src/notifications/dto/find-notifications.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsPositive, IsUUID, Max, Min } from 'class-validator';
import { NotificationPriority, NotificationType } from '../entities/notification.entity';

export class FindNotificationsDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by notification type',
    enum: NotificationType
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ 
    description: 'Filter by read status',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRead?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by dismissed status',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isDismissed?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by priority',
    enum: NotificationPriority
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ 
    description: 'Filter notifications created after this date',
    example: '2023-01-01T00:00:00Z'
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Filter notifications created before this date',
    example: '2023-12-31T23:59:59Z'
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Number of results to skip (for pagination)',
    default: 0,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @ApiPropertyOptional({ 
    description: 'Maximum number of results to return',
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @IsInt()
  @IsPositive()
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

// src/notifications/dto/read-notification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ReadNotificationDto {
  @ApiProperty({ 
    description: 'Mark notification as read',
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  read: boolean;
}

// src/notifications/dto/dismiss-notification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class DismissNotificationDto {
  @ApiProperty({ 
    description: 'Mark notification as dismissed',
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  dismissed: boolean;
}

// src/notifications/dto/notification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { INotification } from '../interfaces/notification.interface';
import { NotificationPriority, NotificationType } from '../entities/notification.entity';

export class NotificationResponseDto implements INotification {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.MESSAGE })
  type: NotificationType;

  @ApiProperty({ example: 'New Message' })
  title: string;

  @ApiProperty({ example: 'You have a new message from John Doe' })
  content: string;

  @ApiProperty({ enum: NotificationPriority, example: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: false })
  isDismissed: boolean;

  @ApiProperty({ example: 'message' })
  relatedEntity?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  relatedEntityId?: string;

  @ApiProperty({ example: '/messages/123' })
  actionUrl?: string;

  @ApiProperty({ example: '2023-05-15T08:30:00.000Z' })
  createdAt: Date;
}

// src/notifications/dto/notification-count-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { INotificationCount } from '../interfaces/notification-count.interface';

export class NotificationCountResponseDto implements INotificationCount {
  @ApiProperty({ example: 15, description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ example: 3, description: 'Number of unread notifications' })
  unread: number;
}

// src/notifications/dto/paginated-notifications-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedNotificationsResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      offset: 0,
      limit: 10,
      hasMore: true
    }
  })
  meta: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}
