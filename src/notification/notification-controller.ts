// src/notifications/controllers/notification.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from '../notification/notification-service';
import { CreateNotificationDto } from './notification-dtos';
import { UpdateNotificationDto } from './notification-dtos';
import { FindNotificationsDto } from './notification-dtos';
import { ReadNotificationDto } from './notification-dtos';
import { DismissNotificationDto } from './notification-dtos';
import { NotificationResponseDto } from './notification-dtos';
import { NotificationCountResponseDto } from './notification-dtos';
import { PaginatedNotificationsResponseDto } from './notification-dtos';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // Adjust import path as needed

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiCreatedResponse({
    description: 'The notification has been successfully created.',
    type: NotificationResponseDto,
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with optional filtering' })
  @ApiOkResponse({
    description: 'List of notifications with pagination metadata.',
    type: PaginatedNotificationsResponseDto,
  })
  async findAll(
    @Query() findNotificationsDto: FindNotificationsDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    const [notifications, total] =
      await this.notificationService.findAll(findNotificationsDto);
    const { limit = 10, offset = 0 } = findNotificationsDto;

    return {
      data: notifications,
      meta: {
        total,
        offset,
        limit,
        hasMore: offset + notifications.length < total,
      },
    };
  }

  @Get('count/:userId')
  @ApiOperation({ summary: 'Get notification counts for a user' })
  @ApiOkResponse({
    description: 'Notification counts for the specified user.',
    type: NotificationCountResponseDto,
  })
  async getCount(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<NotificationCountResponseDto> {
    return this.notificationService.getCount(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search notifications by content or title' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiQuery({ name: 'searchTerm', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({
    description: 'List of notifications matching the search term.',
    type: PaginatedNotificationsResponseDto,
  })
  async search(
    @Query('userId', ParseUUIDPipe) userId: string,
    @Query('searchTerm') searchTerm: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedNotificationsResponseDto> {
    const [notifications, total] =
      await this.notificationService.searchNotifications(
        userId,
        searchTerm,
        limit,
        offset,
      );

    return {
      data: notifications,
      meta: {
        total,
        offset: offset || 0,
        limit: limit || 10,
        hasMore: (offset || 0) + notifications.length < total,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiOkResponse({
    description: 'The notification with the specified ID.',
    type: NotificationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiOkResponse({
    description: 'The notification has been successfully updated.',
    type: NotificationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read/unread' })
  @ApiOkResponse({
    description: 'The notification read status has been updated.',
    type: NotificationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() readNotificationDto: ReadNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (readNotificationDto.read) {
      return this.notificationService.markAsRead(id);
    } else {
      return this.notificationService.update(id, { isRead: false });
    }
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Mark a notification as dismissed/undismissed' })
  @ApiOkResponse({
    description: 'The notification dismiss status has been updated.',
    type: NotificationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async dismiss(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dismissNotificationDto: DismissNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (dismissNotificationDto.dismissed) {
      return this.notificationService.dismiss(id);
    } else {
      return this.notificationService.update(id, { isDismissed: false });
    }
  }

  @Patch('mark-all-as-read/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  @ApiNoContentResponse({
    description: 'All notifications have been marked as read.',
  })
  async markAllAsRead(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.notificationService.markAllAsRead(userId);
  }

  @Patch('dismiss-all/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dismiss all notifications for a user' })
  @ApiNoContentResponse({
    description: 'All notifications have been dismissed.',
  })
  async dismissAll(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.notificationService.dismissAll(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiNoContentResponse({
    description: 'The notification has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationService.delete(id);
  }

  @Delete('user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all notifications for a user' })
  @ApiNoContentResponse({
    description: 'All notifications for the user have been deleted.',
  })
  async removeAllForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.notificationService.deleteAllForUser(userId);
  }
}
