// src/notifications/repositories/notification.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Notification } from './notification-entity';
import { INotificationFilter } from '../interfaces/notification-filter.interface';
import { INotificationCount } from '../interfaces/notification-count.interface';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  async create(notification: Partial<Notification>): Promise<Notification> {
    const newNotification = this.repository.create(notification);
    return this.repository.save(newNotification);
  }

  async findById(id: string): Promise<Notification> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(
    filter: INotificationFilter,
  ): Promise<[Notification[], number]> {
    const {
      userId,
      type,
      isRead,
      isDismissed,
      fromDate,
      toDate,
      priority,
      limit = 10,
      offset = 0,
    } = filter;

    const queryBuilder = this.repository.createQueryBuilder('notification');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('notification.userId = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    if (isDismissed !== undefined) {
      queryBuilder.andWhere('notification.isDismissed = :isDismissed', {
        isDismissed,
      });
    }

    if (priority) {
      queryBuilder.andWhere('notification.priority = :priority', { priority });
    }

    if (fromDate) {
      queryBuilder.andWhere('notification.createdAt >= :fromDate', {
        fromDate,
      });
    }

    if (toDate) {
      queryBuilder.andWhere('notification.createdAt <= :toDate', { toDate });
    }

    // Order by created date descending (newest first)
    queryBuilder.orderBy('notification.createdAt', 'DESC');

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    return queryBuilder.getManyAndCount();
  }

  async getCount(userId: string): Promise<INotificationCount> {
    const result = await this.repository
      .createQueryBuilder('notification')
      .select([
        'COUNT(*) AS total',
        'SUM(CASE WHEN isRead = false THEN 1 ELSE 0 END) AS unread',
      ])
      .where(
        'notification.userId = :userId AND notification.isDismissed = false',
        { userId },
      )
      .getRawOne();

    return { total: result.total, unread: result.unread };
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async markAsRead(id: string, isRead: boolean = true): Promise<Notification> {
    await this.repository.update(id, { isRead });
    return this.findById(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.update(
      { userId, isRead: false, isDismissed: false },
      { isRead: true },
    );
  }

  async dismiss(
    id: string,
    isDismissed: boolean = true,
  ): Promise<Notification> {
    await this.repository.update(id, { isDismissed });
    return this.findById(id);
  }

  async dismissAll(userId: string): Promise<void> {
    await this.repository.update(
      { userId, isDismissed: false },
      { isDismissed: true },
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  async searchNotifications(
    userId: string,
    searchTerm: string,
    limit = 10,
    offset = 0,
  ): Promise<[Notification[], number]> {
    const queryBuilder = this.repository.createQueryBuilder('notification');

    // queryBuilder
    //   .where('notification.userId = :userId', { userId })
    //   .andWhere(
    //     new Brackets((qb) => {
    //       qb.where('notification.title ILIKE :searchTerm', {
    //         searchTerm: `%${searchTerm}%`,
    //       }).orWhere('notification.content ILIKE :searchTerm', {
    //         searchTerm: `%${searchTerm}%`,
    //       });
    //     }),
    //   )
    //   .orderBy('notification.createdAt', 'DESC')
    //   .take(limit)
    //   .skip(offset);

    queryBuilder
      .where('notification.userId = :userId', { userId })
      .andWhere(
        "to_tsvector('english', notification.title || ' ' || notification.content) @@ plainto_tsquery(:searchTerm)",
        { searchTerm },
      )
      .orderBy('notification.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    return queryBuilder.getManyAndCount();
  }
}
