import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { GqlExecutionContext } from '@nestjs/graphql';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { PrismaService } from '../../prisma/prisma.service';
  import { RedisService } from '../../../../libs/shared/src/redis.service';
  
  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly prisma: PrismaService,
      private readonly config: ConfigService,
      private readonly redisService: RedisService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const gqlContext = GqlExecutionContext.create(context);
      const { req } = gqlContext.getContext();
  
      const accessToken = req.headers.accesstoken as string;
      const refreshToken = req.headers.refreshtoken as string;
  
      if (!accessToken || !refreshToken) {
        throw new UnauthorizedException('Please login to access this resource!');
      }

      // Check if token is blacklisted (logged out)
      const isBlacklisted = await this.redisService.exists(`bl:${accessToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked. Please login again.');
      }
  
      try {
        const decoded = this.jwtService.verify(accessToken, {
          secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        });

        const user = await this.prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) {
          throw new UnauthorizedException('User not found!');
        }

        req.accesstoken = accessToken;
        req.refreshtoken = refreshToken;
        req.user = user;
        return true;
      } catch (error) {
        if (error?.name === 'TokenExpiredError') {
          await this.updateAccessToken(req);
          return true;
        }
        throw new UnauthorizedException('Invalid or expired token!');
      }
    }
  
    private async updateAccessToken(req: any): Promise<void> {
      try {
        const refreshTokenData = req.headers.refreshtoken as string;

        // Check if refresh token is blacklisted
        const isBlacklisted = await this.redisService.exists(`bl:${refreshTokenData}`);
        if (isBlacklisted) {
          throw new UnauthorizedException('Session revoked. Please login again.');
        }
  
        const decoded = this.jwtService.verify(refreshTokenData, {
          secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        });
  
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) {
          throw new UnauthorizedException('User not found!');
        }
  
        const accessToken = this.jwtService.sign(
          { id: user.id, email: user.email, role: user.role },
          {
            secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
            expiresIn: '7d',
          },
        );
  
        const refreshToken = this.jwtService.sign(
          { id: user.id },
          {
            secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
            expiresIn: '7d',
          },
        );
  
        req.accesstoken = accessToken;
        req.refreshtoken = refreshToken;
        req.user = user;
      } catch (error) {
        throw new UnauthorizedException('Session expired. Please login again!');
      }
    }
  }