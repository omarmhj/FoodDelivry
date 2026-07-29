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

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req;

      if (!request) {
        throw new UnauthorizedException('Please login to access this resource!');
      }

      const authHeader = request.headers?.['authorization'];
      const accessTokenHeader = request.headers?.['accesstoken'];

      let token: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (accessTokenHeader) {
        token = typeof accessTokenHeader === 'string'
          ? accessTokenHeader.replace('Bearer ', '')
          : undefined;
      }

      if (!token) {
        throw new UnauthorizedException('Please login to access this resource!');
      }

      try {
        const decoded = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
        });

        if (!decoded || !decoded.id) {
          throw new UnauthorizedException('Invalid authentication token!');
        }

        if (decoded.role) {
          request.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        } else {
          request.restaurant = { id: decoded.id, email: decoded.email };
        }

        request.accesstoken = token;
        return true;
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Authentication token has expired!');
        }
        throw new UnauthorizedException('Invalid authentication token!');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentication failed!');
    }
  }
}
