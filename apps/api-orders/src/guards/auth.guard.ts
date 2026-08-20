import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../../libs/shared/src/redis.service';
import { RabbitMQService } from '../../../../libs/shared/src/rabbitmq.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    const accessToken = req.headers['accesstoken'] as string;
    const refreshToken = req.headers['refreshtoken'] as string;

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Please login to access this resource!');
    }

    // Check blacklist
    const isBlacklisted = await this.redisService.exists(`bl:${accessToken}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked. Please login again.');
    }

    try {
      const decoded = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });

      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      req.accesstoken = accessToken;
      req.refreshtoken = refreshToken;
      this.logger.log(`✅ Authenticated: ${decoded.email}`);
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
      const refreshTokenData = req.headers['refreshtoken'] as string;

      const isBlacklisted = await this.redisService.exists(`bl:${refreshTokenData}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Session revoked. Please login again.');
      }

      const decoded = this.jwtService.verify(refreshTokenData, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      // The refresh token deliberately carries nothing but `id`, so the identity
      // has to be re-read from whichever service owns it. Reading `email`/`role`
      // straight off `decoded` looks right but silently yields undefined, which
      // downgraded every admin to a plain user 15 minutes into a session.
      const identity = await this.resolveIdentity(decoded.id);

      const accessToken = this.jwtService.sign(identity, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      });

      const refreshToken = this.jwtService.sign(
        { id: decoded.id },
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      );

      req.user = identity;
      req.accesstoken = accessToken;
      req.refreshtoken = refreshToken;

      // Send new tokens back to client
      const res = req.res;
      if (res) {
        res.setHeader('accesstoken', accessToken);
        res.setHeader('refreshtoken', refreshToken);
      }

      this.logger.log(`🔄 Token refreshed for user: ${decoded.id}`);
    } catch (error) {
      throw new UnauthorizedException('Session expired. Please login again!');
    }
  }

  /**
   * This service owns no accounts collection, so it asks whichever service does.
   * Customers and restaurants both authenticate here against the same shared
   * secret, so an id that is not a user is retried as a restaurant before we
   * give up. Failing to attribute a rotation must not mint a token, so this
   * throws rather than returning a partial identity.
   */
  private async resolveIdentity(
    id: string,
  ): Promise<{ id: string; email?: string; role?: string }> {
    const asUser = await this.rabbitMQService
      .sendAndWait('user.validate', { userId: id })
      .catch((error: any) => {
        this.logger.warn(`user.validate failed for ${id}: ${error?.message}`);
        return null;
      });

    if (asUser?.isValid && asUser.user) {
      return { id, email: asUser.user.email, role: asUser.user.role };
    }

    const asRestaurant = await this.rabbitMQService
      .sendAndWait('restaurant.validate', { restaurantId: id })
      .catch((error: any) => {
        this.logger.warn(`restaurant.validate failed for ${id}: ${error?.message}`);
        return null;
      });

    if (asRestaurant?.isValid && asRestaurant.restaurant) {
      // Restaurant accounts carry no role claim; api-restaurants signs them the
      // same way, so keep the shape identical rather than inventing one.
      return { id, email: asRestaurant.restaurant.email };
    }

    throw new UnauthorizedException('Session expired. Please login again!');
  }
}
