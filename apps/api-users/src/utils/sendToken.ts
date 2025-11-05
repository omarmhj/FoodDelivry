import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

export class TokenSender {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  public sendToken(user: User) {
    const accessToken = this.jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m', // 15 minutes for testing (use 5m in production)
      },
    );

    const refreshToken = this.jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d', // 7 days
      },
    );
    return { user, accessToken, refreshToken };
  }
}