import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { ActivationDto, LoginDto, RegisterDto, FindRestaurantsNearDto } from './dto/restaurant.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { TokenSender } from './utils/send.token';
import { LoginResponse } from './types/restaurant.type';

interface Restaurant {
  name: string;
  country: string;
  city: string;
  address: string;
  email: string;
  phone_number?: number;
  password: string;
  coordinates?: { type: string; coordinates: number[] };
  ownerId?: string;
}

interface AuthenticatedRequest extends Request {
  restaurant?: { id: string; email: string };
  refreshtoken?: string;
  accesstoken?: string;
}

@Injectable()
export class RestaurantService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async registerRestaurant(registerDto: RegisterDto, response: Response) {
    const { name, country, city, address, email, phone_number, password, coordinates, ownerId } = registerDto;

    const isEmailExist = await this.prisma.restaurant.findUnique({
      where: { email },
    });
    
    if (isEmailExist) {
      throw new BadRequestException('Restaurant already exists with this email!');
    }

    if (phone_number) {
      const restaurantWithPhone = await this.prisma.restaurant.findFirst({
        where: { phone_number },
      });
      if (restaurantWithPhone) {
        throw new BadRequestException('Restaurant already exists with this phone number!');
      }
    }

    if (coordinates && (coordinates.type !== 'Point' || coordinates.coordinates.length !== 2)) {
      throw new BadRequestException('Invalid coordinates format. Must be { type: "Point", coordinates: [lng, lat] }');
    }

    if (ownerId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
      });
      if (!owner || owner.role !== 'Owner') {
        throw new BadRequestException('Invalid or non-owner user ID');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const restaurant: Restaurant = {
      name,
      country,
      city,
      address,
      email,
      phone_number,
      password: hashedPassword,
      coordinates,
      ownerId,
    };

    const { activationToken, activationCode } = await this.createActivationToken(restaurant);

    await this.emailService.sendMail({
      email,
      subject: 'Activate your restaurant account!',
      template: './activation-mail',
      name,
      activationCode,
    });

    return {
      activation_token: activationToken,
      message: 'Please check your email to activate your account',
      response,
    };
  }

  async createActivationToken(restaurant: Restaurant) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const activationToken = this.jwtService.sign(
      {
        restaurant,
        activationCode,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: '5m',
      },
    );
    return { activationToken, activationCode };
  }

  async activateRestaurant(activationDto: ActivationDto, response: Response) {
    const { activationToken, activationCode } = activationDto;

    const newRestaurant: { restaurant: Restaurant; activationCode: string; exp?: number } = this.jwtService.verify(
      activationToken,
      {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      } as JwtVerifyOptions,
    );

    if (newRestaurant.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    if (newRestaurant.exp && newRestaurant.exp * 1000 < Date.now()) {
      throw new BadRequestException('Activation token expired');
    }

    const { name, country, city, phone_number, password, email, address, coordinates, ownerId } =
      newRestaurant.restaurant;

    const existRestaurant = await this.prisma.restaurant.findUnique({
      where: { email },
    });

    if (existRestaurant) {
      throw new BadRequestException('Restaurant already exists with this email!');
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name,
        email,
        address,
        country,
        city,
        phone_number,
        password,
        coordinates,
        ownerId,
      },
      include: {
        menus: true,
        menuItems: true,
        operatingHours: true,
        owner: true,
      },
    });

    return { restaurant, response };
  }

  async LoginRestaurant(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { email },
      include: {
        menus: true,
        menuItems: true,
        operatingHours: true,
        owner: true,
      },
    });

    if (restaurant && (await this.comparePassword(password, restaurant.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      return tokenSender.sendToken(restaurant);
    } else {
      return {
        restaurant: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid email or password',
        },
      };
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

 async getLoggedInRestaurant(req: AuthenticatedRequest) {
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        menuItems: true,
        operatingHours: true,
        owner: true,
      },
    });

    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    return {
      restaurant,
      accessToken: req.accesstoken,
      refreshToken: req.refreshtoken,
    };
  }

  async Logout(req: AuthenticatedRequest) {
    if (!req.restaurant) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    req.restaurant = null;
    req.refreshtoken = null;
    req.accesstoken = null;
    return { message: 'Logged out successfully!' };
  }

  async findRestaurantsNear(findRestaurantsNearDto: FindRestaurantsNearDto) {
    const { coordinates, maxDistance } = findRestaurantsNearDto;

    if (coordinates.length !== 2) {
      throw new BadRequestException('Coordinates must be [longitude, latitude]');
    }

     const rawRestaurants = await this.prisma.restaurant.findRaw({
      filter: {
        coordinates: {
          $near: {
            $geometry: { type: 'Point', coordinates },
            $maxDistance: maxDistance,
          },
        },
      },
    });

    if (!Array.isArray(rawRestaurants)) {
      throw new BadRequestException('Unexpected response format from database');
    }

    // Map raw results to Restaurant type
    const restaurants = await Promise.all(
      rawRestaurants.map(async (raw) => {
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: raw._id.toString() },
          include: {
            menus: true,
            menuItems: true,
            operatingHours: true,
            owner: true,
          },
        });
        return restaurant;
      }),
    );

    // Filter out null results (in case some IDs are invalid)
    const validRestaurants = restaurants.filter((r) => r !== null);


    if (!validRestaurants.length) {
      return { restaurants: [], error: { message: 'No restaurants found within the specified radius' } };
    }

    return { restaurants: validRestaurants };
  }
}