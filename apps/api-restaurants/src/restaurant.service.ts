import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { RabbitMQService } from '../../../libs/shared/src/rabbitmq.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import { MESSAGE_PATTERNS, REDIS_MESSAGE_PATTERNS, CACHE_KEYS } from '../../../libs/shared/src/message-patterns';
import { 
  ActivationDto, 
  LoginDto, 
  RegisterDto, 
  FindRestaurantsNearDto,
  CreateMenuDto,
  UpdateMenuDto,
  DeleteMenuDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  DeleteCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  DeleteMenuItemDto,
  CreateOperatingHoursDto,
  UpdateOperatingHoursDto,
  DeleteOperatingHoursDto,
  AddStaffMemberDto,
  RemoveStaffMemberDto
} from './dto/restaurant.dto';
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
  private readonly logger = new Logger(RestaurantService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly redisService: RedisService,
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

    await this.emailService.sendActivationEmail(email, name, activationCode, activationToken);

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
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    // Emit restaurant created event via RabbitMQ
    console.log('🐰 RABBITMQ: About to emit restaurant created event');
    try {
      this.rabbitMQService.emitEvent(MESSAGE_PATTERNS.RESTAURANT_CREATED, {
        id: restaurant.id,
        timestamp: new Date(),
        source: 'restaurant-service',
        version: '1.0.0',
        type: 'restaurant.created',
        data: {
          restaurantId: restaurant.id,
          name: restaurant.name,
          email: restaurant.email,
          address: restaurant.address,
          coordinates: restaurant.coordinates,
        },
      });
      console.log('🐰 RABBITMQ: Event emitted successfully');
    } catch (error) {
      console.error('🐰 RABBITMQ ERROR:', error.message);
    }

    // Cache restaurant data
    console.log('🔴 REDIS: About to cache restaurant data');
    try {
      await this.redisService.set(
        CACHE_KEYS.RESTAURANT(restaurant.id),
        restaurant,
        3600 // 1 hour cache
      );
      console.log('🔴 REDIS: Restaurant cached successfully');
    } catch (error) {
      console.error('🔴 REDIS ERROR:', error.message);
    }

    return { restaurant, response };
  }

  async LoginRestaurant(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // Try to get restaurant from cache first
    const cachedRestaurant = await this.redisService.getJson(CACHE_KEYS.RESTAURANT(email));
    
    let restaurant;
    if (cachedRestaurant) {
      restaurant = cachedRestaurant;
    } else {
      restaurant = await this.prisma.restaurant.findUnique({
        where: { email },
        include: {
          menus: true,
          categories: true,
          menuItems: {
            include: {
              images: true,
              category: true,
              menu: true,
            },
          },
          operatingHours: true,
          owner: true,
        },
      });

      // Cache the restaurant data if found
      if (restaurant) {
        await this.redisService.set(
          CACHE_KEYS.RESTAURANT(restaurant.id),
          restaurant,
          3600 // 1 hour cache
        );
      }
    }

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
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
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
        categories: true,
        menuItems: {
      include: {
        images: true,
      },
    },
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

  // ==================== MENU MANAGEMENT ====================
  
  async createMenu(createMenuDto: CreateMenuDto, req: AuthenticatedRequest) {
    const { name } = createMenuDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const menu = await this.prisma.menu.create({
      data: {
        name,
        restaurantId,
      },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Menu created successfully',
      restaurant: updatedRestaurant,
    };
  }

  async updateMenu(updateMenuDto: UpdateMenuDto, req: AuthenticatedRequest) {
    const { id, name } = updateMenuDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const menu = await this.prisma.menu.findFirst({
      where: { id, restaurantId },
    });

    if (!menu) {
      throw new BadRequestException('Menu not found or not owned by restaurant');
    }

    await this.prisma.menu.update({
      where: { id },
      data: { name },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Menu updated successfully',
      restaurant,
    };
  }

  async deleteMenu(deleteMenuDto: DeleteMenuDto, req: AuthenticatedRequest) {
    const { id } = deleteMenuDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const menu = await this.prisma.menu.findFirst({
      where: { id, restaurantId },
    });

    if (!menu) {
      throw new BadRequestException('Menu not found or not owned by restaurant');
    }

    // First, get all menu items in this menu
    const menuItems = await this.prisma.menuItem.findMany({
      where: { menuId: id },
      select: { id: true }
    });

    // Delete all associated images first
    for (const menuItem of menuItems) {
      await this.prisma.images.deleteMany({
        where: { foodId: menuItem.id },
      });
    }

    // Then delete all menu items in this menu
    await this.prisma.menuItem.deleteMany({
      where: { menuId: id },
    });

    // Finally delete the menu
    await this.prisma.menu.delete({
      where: { id },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Menu deleted successfully',
      restaurant,
    };
  }

  // ==================== CATEGORY MANAGEMENT ====================
  
  async createCategory(createCategoryDto: CreateCategoryDto, req: AuthenticatedRequest) {
    const { name, description } = createCategoryDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const category = await this.prisma.category.create({
      data: { 
        name,
        restaurantId,
        description: description || null
      } as any,
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    }); 

    return {
      message: 'Category created successfully',
      restaurant: restaurants[0], // Return first restaurant as example
    };
  }

  async updateCategory(updateCategoryDto: UpdateCategoryDto, req: AuthenticatedRequest) {
    const { id, name } = updateCategoryDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    await this.prisma.category.update({
      where: { id },
      data: { name },
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Category updated successfully',
      restaurant: restaurants[0], // Return first restaurant as example
    };
  }

  async deleteCategory(deleteCategoryDto: DeleteCategoryDto, req: AuthenticatedRequest) {
    const { id } = deleteCategoryDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Check if category is being used by any menu items
    const menuItemsUsingCategory = await this.prisma.menuItem.findMany({
      where: { categoryId: id },
    });

    if (menuItemsUsingCategory.length > 0) {
      throw new BadRequestException('Cannot delete category that is being used by menu items');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Category deleted successfully',
      restaurant: restaurants[0], // Return first restaurant as example
    };
  }

  // ==================== MENU ITEM MANAGEMENT ====================
  
  async createMenuItem(createMenuItemDto: CreateMenuItemDto, req: AuthenticatedRequest) {
    const { name, description, price, estimatedPrice, categoryId, menuId, available, images } = createMenuItemDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    // Validate that the category belongs to this restaurant
    const category = await this.prisma.category.findFirst({
      where: { 
        id: categoryId,
        restaurantId: restaurantId
      }
    });

    if (!category) {
      throw new BadRequestException('Category not found or does not belong to this restaurant');
    }

    // Validate that the menu belongs to this restaurant
    const menu = await this.prisma.menu.findFirst({
      where: { 
        id: menuId,
        restaurantId: restaurantId
      }
    });

    if (!menu) {
      throw new BadRequestException('Menu not found or does not belong to this restaurant');
    }

    const menuItem = await this.prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        estimatedPrice,
        categoryId,
        menuId,
        restaurantId,
        available: available ?? true,
        images: images ? {
          create: images.map(url => ({ public_id: '', url }))
        } : undefined,
      },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Menu item created successfully',
      restaurant: updatedRestaurant,
    };
  }

  async updateMenuItem(updateMenuItemDto: UpdateMenuItemDto, req: AuthenticatedRequest) {
    const { id, name, description, price, estimatedPrice, categoryId, menuId, available } = updateMenuItemDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!menuItem) {
      throw new BadRequestException('Menu item not found or not owned by restaurant');
    }

    // Validate that the category belongs to this restaurant (if categoryId is provided)
    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { 
          id: categoryId,
          restaurantId: restaurantId
        }
      });

      if (!category) {
        throw new BadRequestException('Category not found or does not belong to this restaurant');
      }
    }

    // Validate that the menu belongs to this restaurant (if menuId is provided)
    if (menuId) {
      const menu = await this.prisma.menu.findFirst({
        where: { 
          id: menuId,
          restaurantId: restaurantId
        }
      });

      if (!menu) {
        throw new BadRequestException('Menu not found or does not belong to this restaurant');
      }
    }

    await this.prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        estimatedPrice,
        categoryId,
        menuId,
        available,
      },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Menu item updated successfully',
      restaurant,
    };
  }

  async deleteMenuItem(deleteMenuItemDto: DeleteMenuItemDto, req: AuthenticatedRequest) {
    const { id } = deleteMenuItemDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!menuItem) {
      throw new BadRequestException('Menu item not found or not owned by restaurant');
    }

    // Delete associated images first
    await this.prisma.images.deleteMany({
      where: { foodId: id },
    });

    // Delete the menu item
    await this.prisma.menuItem.delete({
      where: { id },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Menu item deleted successfully',
      restaurant,
    };
  }

  // ==================== OPERATING HOURS MANAGEMENT ====================
  
  async createOperatingHours(createOperatingHoursDto: CreateOperatingHoursDto, req: AuthenticatedRequest) {
    const { dayOfWeek, openTime, closeTime, isClosed } = createOperatingHoursDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const operatingHours = await this.prisma.operatingHours.create({
      data: {
        dayOfWeek,
        openTime,
        closeTime,
        isClosed: isClosed ?? false,
        restaurantId,
      },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Operating hours created successfully',
      restaurant: updatedRestaurant,
    };
  }

  async updateOperatingHours(updateOperatingHoursDto: UpdateOperatingHoursDto, req: AuthenticatedRequest) {
    const { id, dayOfWeek, openTime, closeTime, isClosed } = updateOperatingHoursDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const operatingHours = await this.prisma.operatingHours.findFirst({
      where: { id, restaurantId },
    });

    if (!operatingHours) {
      throw new BadRequestException('Operating hours not found or not owned by restaurant');
    }

    await this.prisma.operatingHours.update({
      where: { id },
      data: {
        dayOfWeek,
        openTime,
        closeTime,
        isClosed,
      },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Operating hours updated successfully',
      restaurant,
    };
  }

  async deleteOperatingHours(deleteOperatingHoursDto: DeleteOperatingHoursDto, req: AuthenticatedRequest) {
    const { id } = deleteOperatingHoursDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const operatingHours = await this.prisma.operatingHours.findFirst({
      where: { id, restaurantId },
    });

    if (!operatingHours) {
      throw new BadRequestException('Operating hours not found or not owned by restaurant');
    }

    await this.prisma.operatingHours.delete({
      where: { id },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: {
          include: {
            images: true,
            category: true,
            menu: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Operating hours deleted successfully',
      restaurant,
    };
  }

  // ==================== STAFF MANAGEMENT ====================
  
  async addStaffMember(addStaffMemberDto: AddStaffMemberDto, req: AuthenticatedRequest) {
    const { userId, role } = addStaffMemberDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    // Validate user exists via RabbitMQ (users service is the source of truth)
    const validation = await this.rabbitMQService.sendAndWait('user.validate', { userId });
    if (!validation.isValid) {
      throw new BadRequestException(`User not found: ${validation.error}`);
    }

    const validatedUser = validation.user;

    // Upsert the user into the restaurants DB local copy
    await this.prisma.user.upsert({
      where: { id: userId },
      update: { role: role as any },
      create: {
        id: userId,
        name: validatedUser.name,
        email: validatedUser.email,
        password: 'managed-by-users-service',
        role: role as any,
      },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: { include: { images: true, category: true, menu: true } },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Staff member added successfully',
      restaurant: updatedRestaurant,
    };
  }

  async removeStaffMember(removeStaffMemberDto: RemoveStaffMemberDto, req: AuthenticatedRequest) {
    const { userId } = removeStaffMemberDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    // Validate user exists via RabbitMQ
    const validation = await this.rabbitMQService.sendAndWait('user.validate', { userId });
    if (!validation.isValid) {
      throw new BadRequestException(`User not found: ${validation.error}`);
    }

    // Update local copy role back to User
    await this.prisma.user.upsert({
      where: { id: userId },
      update: { role: 'User' as any },
      create: {
        id: userId,
        name: validation.user.name,
        email: validation.user.email,
        password: 'managed-by-users-service',
        role: 'User' as any,
      },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        categories: true,
        menuItems: { include: { images: true, category: true, menu: true } },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Staff member removed successfully',
      restaurant: updatedRestaurant,
    };
  }

  // Validate restaurant for Orders Service (RabbitMQ handler)
  async validateRestaurant(data: { restaurantId: string }) {
    this.logger.log(`🔍 Validating restaurant: ${data.restaurantId}`);
    
    try {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: data.restaurantId },
      });

      if (!restaurant) {
        return {
          isValid: false,
          error: 'Restaurant not found',
        };
      }

      const response = {
        isValid: true,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          email: restaurant.email,
          address: restaurant.address,
        },
      };
      return response;
    } catch (error) {
      this.logger.error(`❌ Restaurant validation failed: ${error.message}`);
      return {
        isValid: false,
        error: 'Validation failed',
      };
    }
  }

  // Validate menu items for Orders Service (RabbitMQ handler)
  async validateMenuItems(data: { restaurantId: string; items: Array<{ menuItemId: string; quantity: number }> }) {
    this.logger.log(`🔍 Validating menu items for restaurant: ${data.restaurantId}`);
    
    try {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: data.restaurantId },
        include: {
          menuItems: true,
        },
      });

      if (!restaurant) {
        return {
          isValid: false,
          error: 'Restaurant not found',
        };
      }

      const validItems = [];
      const errors = [];

      for (const item of data.items) {
        const menuItem = restaurant.menuItems.find(mi => mi.id === item.menuItemId);
        
        if (!menuItem) {
          errors.push(`Menu item ${item.menuItemId} not found`);
          continue;
        }

        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for menu item ${menuItem.name}`);
          continue;
        }

        validItems.push(menuItem);
      }

      if (errors.length > 0) {
        return {
          isValid: false,
          error: errors.join(', '),
          validItems: [],
        };
      }

      return {
        isValid: true,
        validItems,
      };
    } catch (error) {
      this.logger.error(`❌ Menu items validation failed: ${error.message}`);
      return {
        isValid: false,
        error: 'Validation failed',
        validItems: [],
      };
    }
  }
}