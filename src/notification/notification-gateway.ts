// src/notifications/gateways/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard'; // Adjust import path as needed
import { Notification } from './notification-entity';

interface UserSocket {
  userId: string;
  socketId: string;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*', // In production, restrict this to your allowed origins
  },
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationGateway');
  private userSockets: UserSocket[] = [];

  afterInit(server: Server) {
    this.logger.log('Notification WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract user ID from JWT token
      const userId = client.handshake.auth.token
        ? this.getUserIdFromToken(client.handshake.auth.token)
        : null;

      if (!userId) {
        this.logger.error('Client connection rejected - No valid user ID');
        client.disconnect();
        return;
      }

      // Store the user-socket mapping
      this.userSockets.push({
        userId,
        socketId: client.id,
      });

      // Join user to their private room
      client.join(`user:${userId}`);
      
      this.logger.log(`Client connected: ${client.id} for user: ${userId}`);
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove disconnected socket from userSockets
    this.userSockets = this.userSockets.filter((us) => us.socketId !== client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinNotificationRoom')
  handleJoinRoom(client: Socket, userId: string) {
    // Additional validation could be done here
    client.join(`user:${userId}`);
    return { event: 'joinedRoom', data: { room: `user:${userId}` } };
  }

  @OnEvent('notification.created')
  handleNotificationCreated(notification: Notification) {
    this.server.to(`user:${notification.userId}`).emit('notification.created', notification);
  }

  @OnEvent('notification.updated')
  handleNotificationUpdated(notification: Notification) {
    this.server.to(`user:${notification.userId}`).emit('notification.updated', notification);
  }

  @OnEvent('notification.read')
  handleNotificationRead(notification: Notification) {
    this.server.to(`user:${notification.userId}`).emit('notification.read', notification);
  }

  @OnEvent('notification.dismissed')
  handleNotificationDismissed(notification: Notification) {
    this.server.to(`user:${notification.userId}`).emit('notification.dismissed', notification);
  }

  @OnEvent('notification.deleted')
  handleNotificationDeleted(payload: { id: string }) {
    // Since we don't have the userId in the payload, we send to all clients
    // In a real application, you'd want to maintain a mapping of notification IDs to user IDs
    this.server.emit('notification.deleted', payload);
  }

  @OnEvent('notification.allRead')
  handleAllNotificationsRead(payload: { userId: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification.allRead', payload);
  }

  @OnEvent('notification.allDismissed')
  handleAllNotificationsDismissed(payload: { userId: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification.allDismissed', payload);
  }

  @OnEvent('notification.allDeleted')
  handleAllNotificationsDeleted(payload: { userId: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification.allDeleted', payload);
  }

  // Helper method to extract userId from JWT token
  private getUserIdFromToken(token: string): string | null {
    try {
      // This is a placeholder. In a real app, you would decode and verify the JWT
      // using the same logic as in your WsJwtGuard
      const payload = this.decodeToken(token);
      return payload.sub;
    } catch (e) {
      this.logger.error(`Error extracting user ID from token: ${e.message}`);
      return null;
    }
  }

  private decodeToken(token: string): { sub: string } {
    // Placeholder for JWT decoding logic
    // In a real application, use a proper JWT library
    // Example with jsonwebtoken:
    // return jwt.verify(token, process.env.JWT_SECRET) as { sub: string };
    
    // This is just a mock implementation for demonstration
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
    return JSON.parse(payload);
  }
}

// src/auth/guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private logger = new Logger('WsJwtGuard');

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.error('Missing authentication token');
      throw new WsException('Unauthorized');
    }

    try {
      // Validate token logic here
      // This is a placeholder. In a real app, you would decode and verify the JWT
      // const payload = jwt.verify(token, process.env.JWT_SECRET);
      // client.user = payload;
      
      // For demo purposes, we'll just return true
      return true;
    } catch (e) {
      this.logger.error(`Invalid authentication token: ${e.message}`);
      throw new WsException('Unauthorized');
    }
  }
}
