import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto, GetMessagesDto } from './dto/chat.dto';
import {
  ConversationEntity,
  ConversationResponse,
  ConversationsResponse,
  MessageEntity,
  MessagesResponse,
} from './entities/chat.entities';
import { AuthGuard } from './guards/auth.guard';

@Resolver('Chat')
export class ChatResolver {
  private readonly logger = new Logger(ChatResolver.name);

  constructor(private readonly chatService: ChatService) {}

  @Mutation(() => ConversationResponse)
  @UseGuards(AuthGuard)
  async createConversation(
    @Args('input') input: CreateConversationDto,
    @Context() context: Record<string, unknown>,
  ): Promise<ConversationResponse> {
    try {
      const req = context.req as any;
      const requesterId = req.user?.id || req.restaurant?.id;
      // Ensure the requester is part of the conversation
      if (requesterId && !input.participants.includes(requesterId)) {
        input.participants.push(requesterId);
      }
      const conversation = await this.chatService.createConversation(input);
      return { message: 'Conversation ready', conversation: conversation as unknown as ConversationEntity };
    } catch (error) {
      return { message: 'Failed to create conversation', error: { message: error.message, code: 'CREATE_CONVERSATION_FAILED' } };
    }
  }

  @Query(() => ConversationsResponse)
  @UseGuards(AuthGuard)
  async myConversations(
    @Context() context: Record<string, unknown>,
  ): Promise<ConversationsResponse> {
    try {
      const req = context.req as any;
      const participantId = req.user?.id || req.restaurant?.id;
      if (!participantId) {
        return { conversations: [], error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } };
      }
      const conversations = await this.chatService.getUserConversations(participantId);
      return { conversations: conversations as unknown as ConversationEntity[] };
    } catch (error) {
      return { conversations: [], error: { message: error.message, code: 'GET_CONVERSATIONS_FAILED' } };
    }
  }

  @Query(() => MessagesResponse)
  @UseGuards(AuthGuard)
  async conversationMessages(
    @Args('input') input: GetMessagesDto,
    @Context() context: Record<string, unknown>,
  ): Promise<MessagesResponse> {
    try {
      const req = context.req as any;
      const participantId = req.user?.id || req.restaurant?.id;
      const allowed = await this.chatService.isParticipant(input.conversationId, participantId);
      if (!allowed) {
        return { messages: [], total: 0, error: { message: 'You are not a participant in this conversation', code: 'FORBIDDEN' } };
      }
      const result = await this.chatService.getMessages(input);
      return {
        messages: result.messages as unknown as MessageEntity[],
        total: result.total,
      };
    } catch (error) {
      return { messages: [], total: 0, error: { message: error.message, code: 'GET_MESSAGES_FAILED' } };
    }
  }
}
