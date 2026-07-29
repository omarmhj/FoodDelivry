import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ErrorType {
  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class MessageEntity {
  @Field()
  id: string;

  @Field()
  conversationId: string;

  @Field()
  senderId: string;

  @Field()
  senderName: string;

  @Field()
  content: string;

  @Field(() => [String])
  readBy: string[];

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ConversationEntity {
  @Field()
  id: string;

  @Field(() => [String])
  participants: string[];

  @Field({ nullable: true })
  restaurantId?: string;

  @Field({ nullable: true })
  orderId?: string;

  @Field({ nullable: true })
  lastMessage?: string;

  @Field({ nullable: true })
  lastMessageAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ConversationResponse {
  @Field()
  message: string;

  @Field(() => ConversationEntity, { nullable: true })
  conversation?: ConversationEntity;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class ConversationsResponse {
  @Field(() => [ConversationEntity])
  conversations: ConversationEntity[];

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class MessagesResponse {
  @Field(() => [MessageEntity])
  messages: MessageEntity[];

  @Field(() => Int)
  total: number;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}
