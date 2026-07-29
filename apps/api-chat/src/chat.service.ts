import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import { RabbitMQService } from '../../../libs/shared/src/rabbitmq.service';
import { CreateConversationDto, GetMessagesDto } from './dto/chat.dto';

// Redis channel used to broadcast chat messages across all service instances
export const CHAT_BROADCAST_CHANNEL = 'chat:broadcast';

interface PersistMessageInput {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // ==================== CONVERSATIONS ====================

  async createConversation(dto: CreateConversationDto) {
    // Reuse an existing conversation with the same participant set + context
    const existing = await this.prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: dto.participants },
        restaurantId: dto.restaurantId ?? undefined,
        orderId: dto.orderId ?? undefined,
      },
    });
    if (existing && existing.participants.length === dto.participants.length) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        participants: dto.participants,
        restaurantId: dto.restaurantId,
        orderId: dto.orderId,
      },
    });
  }

  async getUserConversations(participantId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { has: participantId } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({ where: { id: conversationId } });
  }

  async getMessages(dto: GetMessagesDto) {
    const limit = dto.limit ?? 50;
    const skip = dto.skip ?? 0;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: dto.conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.message.count({ where: { conversationId: dto.conversationId } }),
    ]);
    // Return in chronological order for display
    return { messages: messages.reverse(), total };
  }

  // ==================== MESSAGES ====================

  /**
   * Persist a message, update the conversation, broadcast via Redis pub/sub,
   * and emit a message.sent event to RabbitMQ for offline notifications.
   */
  async persistMessage(input: PersistMessageInput) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        senderName: input.senderName,
        content: input.content,
        readBy: [input.senderId],
      },
    });

    // Update conversation preview
    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessage: input.content, lastMessageAt: message.createdAt },
    });

    // Broadcast to all instances via Redis pub/sub (Step 8.2)
    await this.redis.publish(CHAT_BROADCAST_CHANNEL, {
      conversationId: input.conversationId,
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        readBy: message.readBy,
        createdAt: message.createdAt,
      },
    });

    // Notify other participants for offline delivery (Step 8.4)
    const conversation = await this.getConversationById(input.conversationId);
    const recipients = (conversation?.participants || []).filter((p) => p !== input.senderId);
    this.rabbitMQService.emitEvent('message.sent', {
      messageId: message.id,
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderName: input.senderName,
      recipients,
      content: input.content,
      timestamp: message.createdAt,
    });

    return message;
  }

  async markConversationRead(conversationId: string, participantId: string) {
    // Add participant to readBy for messages they haven't read yet
    const unread = await this.prisma.message.findMany({
      where: {
        conversationId,
        NOT: { readBy: { has: participantId } },
      },
      select: { id: true, readBy: true },
    });

    await Promise.all(
      unread.map((m) =>
        this.prisma.message.update({
          where: { id: m.id },
          data: { readBy: { set: [...m.readBy, participantId] } },
        }),
      ),
    );

    return unread.length;
  }

  /** Verify a participant belongs to a conversation (authorization check) */
  async isParticipant(conversationId: string, participantId: string): Promise<boolean> {
    const conversation = await this.getConversationById(conversationId);
    return !!conversation && conversation.participants.includes(participantId);
  }
}
