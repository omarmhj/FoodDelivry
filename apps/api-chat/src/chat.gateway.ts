import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService, CHAT_BROADCAST_CHANNEL } from './chat.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import { SendMessagePayload } from './dto/chat.dto';

interface AuthedSocket extends Socket {
  data: {
    userId?: string;
    userName?: string;
    email?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4000',
          'http://localhost:5173', // customer app (Vite)
          'http://localhost:5174', // restaurant dashboard (Vite)
          'http://localhost:5175', // delivery app (Vite)
          'http://127.0.0.1:5173',
          'http://localhost:4173', // vite preview
          'https://studio.apollographql.com',
        ],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Step 8.2: subscribe to Redis so messages published by ANY instance are
  // broadcast to the sockets connected to THIS instance.
  async afterInit() {
    await this.redis.subscribe(CHAT_BROADCAST_CHANNEL, (raw: string) => {
      try {
        const { conversationId, message } = JSON.parse(raw);
        this.server.to(conversationId).emit('message', message);
      } catch (error: any) {
        this.logger.error(`❌ Failed to handle broadcast: ${error.message}`);
      }
    });
    this.logger.log(`🔌 Subscribed to Redis channel "${CHAT_BROADCAST_CHANNEL}"`);
  }

  handleConnection(client: AuthedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`⚠️ Connection rejected (no token): ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });

      if (!decoded?.id) {
        client.disconnect(true);
        return;
      }

      client.data.userId = decoded.id;
      client.data.userName = decoded.name || decoded.email || 'Unknown';
      client.data.email = decoded.email;

      // Personal room so we can target a user directly if needed
      client.join(`user:${decoded.id}`);
      this.logger.log(`✅ Client connected: ${client.id} (user ${decoded.id})`);
      client.emit('connected', { userId: decoded.id });
    } catch (error: any) {
      this.logger.warn(`⚠️ Connection rejected (bad token): ${error.message}`);
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoin(
    @MessageBody() body: { conversationId: string },
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Not authenticated' };

    const allowed = await this.chatService.isParticipant(body.conversationId, userId);
    if (!allowed) {
      return { error: 'You are not a participant in this conversation' };
    }

    client.join(body.conversationId);
    this.logger.log(`👥 ${userId} joined conversation ${body.conversationId}`);
    return { joined: body.conversationId };
  }

  @SubscribeMessage('leaveConversation')
  handleLeave(
    @MessageBody() body: { conversationId: string },
    @ConnectedSocket() client: AuthedSocket,
  ) {
    client.leave(body.conversationId);
    return { left: body.conversationId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() body: SendMessagePayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const userId = client.data.userId;
    const userName = client.data.userName || 'Unknown';
    if (!userId) return { error: 'Not authenticated' };

    if (!body?.conversationId || !body?.content?.trim()) {
      return { error: 'conversationId and content are required' };
    }

    const allowed = await this.chatService.isParticipant(body.conversationId, userId);
    if (!allowed) {
      return { error: 'You are not a participant in this conversation' };
    }

    // Persistence + Redis broadcast + RabbitMQ event all happen in the service.
    // We do NOT emit here — the Redis subscriber emits to the room so the path
    // is identical whether the recipient is on this instance or another.
    const message = await this.chatService.persistMessage({
      conversationId: body.conversationId,
      senderId: userId,
      senderName: userName,
      content: body.content.trim(),
    });

    return { sent: true, messageId: message.id };
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() body: { conversationId: string },
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Not authenticated' };

    const count = await this.chatService.markConversationRead(body.conversationId, userId);
    // Let others know this user has read the conversation
    client.to(body.conversationId).emit('read', { conversationId: body.conversationId, userId });
    return { markedRead: count };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() body: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    // Ephemeral — broadcast to everyone else in the room, not persisted
    client.to(body.conversationId).emit('typing', {
      conversationId: body.conversationId,
      userId,
      isTyping: !!body.isTyping,
    });
  }

  private extractToken(client: AuthedSocket): string | undefined {
    const authToken = (client.handshake?.auth as any)?.token;
    const queryToken = client.handshake?.query?.token as string | undefined;
    const headerToken = client.handshake?.headers?.['accesstoken'] as string | undefined;
    const raw = authToken || queryToken || headerToken;
    return raw ? String(raw).replace('Bearer ', '') : undefined;
  }
}
