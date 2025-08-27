import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse, Restaurant } from '../types/restaurant.type';


export class TokenSender {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  public sendToken(restaurant: Restaurant): LoginResponse {
    const accessToken = this.jwt.sign(
      {
        id: restaurant.id, email: restaurant.email
      },
      {
        secret: this.config.get<string>('JWT_SECRET_KEY'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      {
        id: restaurant.id, email: restaurant.email
      },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET_KEY'),
        expiresIn: '5d',
      },
    );
    return { restaurant, accessToken, refreshToken, error: null };
  }
}
