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

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
  restaurant?: { id: string; email: string };
  accesstoken?: string;
  refreshtoken?: string;
}

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
      const request: AuthenticatedRequest = ctx.getContext().req;

      if (!request) {
        this.logger.warn('❌ No request object found in context');
        throw new UnauthorizedException('Please login to access this resource!');
      }

      // Extract token from headers
      const authHeader = request.headers?.['authorization'];
      const accessTokenHeader = request.headers?.['accesstoken'];
      
      let token: string | undefined;

      // Try different token extraction methods
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (accessTokenHeader) {
        // Handle accessToken header (with or without Bearer prefix)
        token = typeof accessTokenHeader === 'string' 
          ? accessTokenHeader.replace('Bearer ', '')
          : undefined;
      }

      if (!token) {
        this.logger.warn('❌ No authentication token found');
        throw new UnauthorizedException('Please login to access this resource!');
      }

      try {
        // Verify JWT token
        const decoded = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
        });

        if (!decoded) {
          this.logger.warn('❌ Invalid token payload');
          throw new UnauthorizedException('Invalid authentication token!');
        }

        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          this.logger.warn('❌ Token has expired');
          throw new UnauthorizedException('Authentication token has expired!');
        }

        // Attach user/restaurant info to request
        if (decoded.id && decoded.email) {
          if (decoded.role) {
            // User token
            request.user = {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
            };
            this.logger.log(`✅ User authenticated: ${decoded.email} (${decoded.role})`);
          } else {
            // Restaurant token
            request.restaurant = {
              id: decoded.id,
              email: decoded.email,
            };
            this.logger.log(`✅ Restaurant authenticated: ${decoded.email}`);
          }
          
          request.accesstoken = token;
          return true;
        } else {
          this.logger.warn('❌ Token missing required fields (id, email)');
          throw new UnauthorizedException('Invalid authentication token format!');
        }
      } catch (jwtError) {
        this.logger.warn(`❌ JWT verification failed: ${jwtError.message}`);
        
        if (jwtError.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Authentication token has expired!');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid authentication token!');
        } else {
          throw new UnauthorizedException('Authentication failed!');
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`❌ Authentication guard error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed!');
    }
  }
}









