import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

export interface OrderLivePayload {
  type: string;
  orderId: string;
  orderNumber?: string;
  restaurantId: string;
  status: string;
}

const SOCKET_CORS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:4173',
    ];

@WebSocketGateway({
  cors: {
    origin: SOCKET_CORS,
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });
      client.data.actorId = decoded.id;
      client.emit('connected', { actorId: decoded.id });
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Order socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinOrder')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { orderId?: string },
  ) {
    if (!body?.orderId) {
      return { error: 'orderId is required' };
    }
    client.join(`order:${body.orderId}`);
    return { joined: `order:${body.orderId}` };
  }

  @SubscribeMessage('leaveOrder')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { orderId?: string },
  ) {
    if (body?.orderId) {
      client.leave(`order:${body.orderId}`);
    }
    return { left: true };
  }

  @SubscribeMessage('joinRestaurant')
  handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string },
  ) {
    if (!body?.restaurantId) {
      return { error: 'restaurantId is required' };
    }
    client.join(`restaurant:${body.restaurantId}`);
    return { joined: `restaurant:${body.restaurantId}` };
  }

  @SubscribeMessage('leaveRestaurant')
  handleLeaveRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { restaurantId?: string },
  ) {
    if (body?.restaurantId) {
      client.leave(`restaurant:${body.restaurantId}`);
    }
    return { left: true };
  }

  broadcastOrderEvent(payload: OrderLivePayload): void {
    if (!this.server) {
      return;
    }
    this.server.to(`order:${payload.orderId}`).emit('order.updated', payload);
    this.server.to(`restaurant:${payload.restaurantId}`).emit('order.updated', payload);
    if (payload.type === 'order.placed') {
      this.server.to(`restaurant:${payload.restaurantId}`).emit('order.placed', payload);
    }
  }

  private extractToken(client: Socket): string | undefined {
    const fromAuth = (client.handshake.auth as { token?: string } | undefined)?.token;
    const fromQuery = client.handshake.query?.token;
    const header = client.handshake.headers?.accesstoken;
    const raw = fromAuth ?? (Array.isArray(fromQuery) ? fromQuery[0] : fromQuery) ?? header;
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  }
}
