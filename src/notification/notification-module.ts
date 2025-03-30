// src/notifications/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationController } from './notification-controller';
import { NotificationService } from './notification-service';
import { NotificationRepository } from './notification-service';
import { NotificationGateway } from './notification-gateway';
import { Notification } from './notification-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
