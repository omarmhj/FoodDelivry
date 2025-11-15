import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  RESERVATION_CONFIRMATION = 'RESERVATION_CONFIRMATION',
  PROMOTION = 'PROMOTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendEmailNotificationDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

export class SendSmsNotificationDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

export class SendPushNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class MarkAsReadDto {
  @IsString()
  @IsNotEmpty()
  notificationId: string;
}

export class GetNotificationsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

