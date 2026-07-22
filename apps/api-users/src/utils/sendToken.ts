import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '.prisma/users-client';

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
        expiresIn: '7d', // 7 days for development
      },
    );

    const refreshToken = this.jwt.sign(
      {
        id: user.id,
      },
      {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d', // 7 days
      },
    );
    return { user, accessToken, refreshToken };
  }
}