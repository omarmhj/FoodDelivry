import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class CreateConversationDto {
  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orderId?: string;
}

@InputType()
export class GetMessagesDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;
}

// Payload for the WebSocket "sendMessage" event (not a GraphQL input)
export interface SendMessagePayload {
  conversationId: string;
  content: string;
}
