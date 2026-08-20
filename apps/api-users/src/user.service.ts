import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import {
  ActivationDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/user.dto';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { User } from '.prisma/users-client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../../libs/shared/src/redis.service';

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable() 
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  // register user service
  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto;

    const isEmailExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (isEmailExist) {
      throw new BadRequestException('Unable to process registration. Please try with different credentials.');
    }

    const phoneNumbersToCheck = [phone_number];

    const usersWithPhoneNumber = await this.prisma.user.findMany({
      where: {
        phone_number: {
          not: null,
          in: phoneNumbersToCheck,
        },
      },
    });

    if (usersWithPhoneNumber.length > 0) {
      throw new BadRequestException(
        'Unable to process registration. Please try with different credentials.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
      phone_number,
    };

    const activationToken = await this.createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const activation_token = activationToken.token;

    try {
      await this.emailService.sendMail({
        email,
        subject: 'Activate your account!',
        template: './activation-mail',
        name,
        activationCode,
      });
      this.logger.log(`✅ Activation email sent to ${email}`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to send email, but user registration continues. Code: ${activationCode}`);
    }

    return { activation_token, response };
  }

  // create activation token
  async createActivationToken(user: UserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store user data (including password) in Redis, NOT in the JWT
    const registrationId = `reg:${user.email}:${Date.now()}`;
    await this.redisService.set(
      registrationId,
      JSON.stringify(user),
      600, // 10 minutes TTL
    );

    const token = this.jwtService.sign(
      {
        registrationId,
        email: user.email,
        activationCode,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: '10m',
      },
    );
    return { token, activationCode };
  }

  // activation user
  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationToken, activationCode } = activationDto;

    const decoded: { registrationId: string; email: string; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { registrationId: string; email: string; activationCode: string };

    if (decoded.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    // Retrieve user data from Redis
    const userData = await this.redisService.get(decoded.registrationId);
    if (!userData) {
      throw new BadRequestException('Activation token expired. Please register again.');
    }

    const { name, email, password, phone_number }: UserData = JSON.parse(userData);

    const existUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) {
      throw new BadRequestException('User already activated.');
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number,
      },
    });

    // Clean up Redis after successful activation
    await this.redisService.del(decoded.registrationId);

    return { user, response };
  }

  // Login service
  async Login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user && (await this.comparePassword(password, user.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      return tokenSender.sendToken(user);
    } else {
      return {
        user: undefined,
        accessToken: undefined,
        refreshToken: undefined,
        error: {
          message: 'Invalid email or password',
        },
      };
    }
  }

  // compare with hashed password
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // generate forgot password link
  async generateForgotPasswordLink(user: User) {
    const forgotPasswordToken = this.jwtService.sign(
      {
        user,
      },
      {
        secret: this.configService.get<string>('FORGOT_PASSWORD_SECRET'),
        expiresIn: '5m',
      },
    );
    return forgotPasswordToken;
  }

  // forgot password
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Always return success to prevent account enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }
    const forgotPasswordToken = await this.generateForgotPasswordLink(user);

    const resetPasswordUrl =
      this.configService.get<string>('CLIENT_SIDE_URI') +
      `/reset-password?verify=${forgotPasswordToken}`;

    await this.emailService.sendMail({
      email,
      subject: 'Reset your Password!',
      template: './forgot-password',
      name: user.name,
      activationCode: resetPasswordUrl,
    });

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  // reset password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, activationToken } = resetPasswordDto;

    let decoded: any;
    try {
      decoded = this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('FORGOT_PASSWORD_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token!');
    }

    if (!decoded) {
      throw new BadRequestException('Invalid token!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.update({
      where: {
        id: decoded.user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return { user };
  }

  // get logged in user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshtoken;
    const accessToken = req.accesstoken;
    return { user, refreshToken, accessToken };
  }

  // log out user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async Logout(req: any) {
    const accessToken = req.accesstoken;
    const refreshToken = req.refreshtoken;

    // Blacklist both tokens in Redis until they expire
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as any;
        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await this.redisService.set(`bl:${accessToken}`, '1', ttl);
          }
        }
      } catch (e) { /* token already invalid, nothing to blacklist */ }
    }
    if (refreshToken) {
      try {
        const decoded = this.jwtService.decode(refreshToken) as any;
        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await this.redisService.set(`bl:${refreshToken}`, '1', ttl);
          }
        }
      } catch (e) { /* token already invalid */ }
    }

    req.user = null;
    req.refreshtoken = null;
    req.accesstoken = null;
    return { message: 'Logged out successfully!' };
  }

  // get all users service
  async getUsers() {
    return this.prisma.user.findMany({});
  }

  // Validate user for Orders Service (RabbitMQ handler)
  async validateUser(data: { userId: string }) {
    this.logger.log(`🔍 Validating user: ${data.userId}`);
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        return {
          isValid: false,
          error: 'User not found',
        };
      }

      const response = {
        isValid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          // Callers authorize on this: api-restaurants checks for
          // 'Restaurant_Owner' before accepting an ownerId, api-orders checks
          // for 'Admin', and the api-orders AuthGuard needs it to re-issue an
          // access token without losing the caller's role.
          role: user.role,
        },
      };
      return response;
    } catch (error) {
      this.logger.error(`❌ User validation failed: ${error.message}`);
      return {
        isValid: false,
        error: 'Validation failed',
      };
    }
  }

  // Get user by ID (used by both GraphQL resolver and RabbitMQ handler)
  async getUserById(data: { userId: string }) {
    this.logger.log(`📋 Getting user by ID: ${data.userId}`);
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        include: { avatar: true },
      });

      if (!user) {
        return { user: null, error: 'User not found' };
      }

      return { user };
    } catch (error) {
      this.logger.error(`❌ Get user failed: ${error.message}`);
      return { user: null, error: 'Failed to get user' };
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string) {
    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await this.redisService.exists(`bl:${refreshToken}`);
      if (isBlacklisted) {
        return {
          accessToken: undefined,
          refreshToken: undefined,
          error: { message: 'Session revoked. Please login again.' },
        };
      }

      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      if (!decoded || !decoded.id) {
        return {
          accessToken: undefined,
          refreshToken: undefined,
          error: { message: 'Invalid refresh token' },
        };
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return {
          accessToken: undefined,
          refreshToken: undefined,
          error: { message: 'User not found' },
        };
      }

      // Generate new tokens
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      const tokens = tokenSender.sendToken(user);

      this.logger.log(`🔄 Tokens refreshed for user: ${user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        error: undefined,
      };
    } catch (error) {
      this.logger.warn(`❌ Token refresh failed: ${error.message}`);
      return {
        accessToken: undefined,
        refreshToken: undefined,
        error: { message: 'Invalid or expired refresh token. Please login again.' },
      };
    }
  }
}