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
  RemoveStaffMemberDto,
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  DeleteOptionGroupDto,
  CreateItemOptionDto,
  UpdateItemOptionDto,
  DeleteItemOptionDto,
  GetMenuItemDto
} from './dto/restaurant.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { TokenSender } from './utils/send.token';
import { LoginResponse } from './types/restaurant.type';

/**
 * Option groups are always returned in the order the owner arranged them, with
 * their choices nested, so the customer app can render the customization sheet
 * without any client-side sorting.
 */
const MENU_ITEM_OPTION_GROUPS_INCLUDE = {
  orderBy: { displayOrder: 'asc' },
  include: {
    options: { orderBy: { displayOrder: 'asc' } },
  },
} as const;

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
      // Validate owner via RabbitMQ (users service is the source of truth)
      const validation = await this.rabbitMQService.sendAndWait('user.validate', { userId: ownerId });
      if (!validation.isValid || validation.user?.role !== 'Restaurant_Owner') {
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
              optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
            },
          },
          operatingHours: true,
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
        restaurant: undefined,
        accessToken: undefined,
        refreshToken: undefined,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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

    const accessToken = req.accesstoken;
    const refreshToken = req.refreshtoken;

    // Blacklist both tokens in Redis until they expire
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as any;
        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) await this.redisService.set(`bl:${accessToken}`, '1', ttl);
        }
      } catch (e) { /* already invalid */ }
    }
    if (refreshToken) {
      try {
        const decoded = this.jwtService.decode(refreshToken) as any;
        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) await this.redisService.set(`bl:${refreshToken}`, '1', ttl);
        }
      } catch (e) { /* already invalid */ }
    }

    req.restaurant = undefined;
    req.refreshtoken = undefined;
    req.accesstoken = undefined;
    return { message: 'Logged out successfully!' };
  }

  async findRestaurantsNear(findRestaurantsNearDto: FindRestaurantsNearDto) {
    const { coordinates, maxDistance } = findRestaurantsNearDto;

    if (coordinates.length !== 2) {
      throw new BadRequestException('Coordinates must be [longitude, latitude]');
    }

    // Use aggregateRaw with $geoNear pipeline — requires 2dsphere index on coordinates
    const rawRestaurants = await this.prisma.restaurant.aggregateRaw({
      pipeline: [
        {
          $geoNear: {
            near: { type: 'Point', coordinates },
            distanceField: 'distance',
            maxDistance: maxDistance,
            spherical: true,
          },
        },
      ],
    }) as unknown as any[]; // aggregateRaw returns JsonObject but we know it's an array at runtime

    if (!Array.isArray(rawRestaurants)) {
      throw new BadRequestException('Unexpected response format from database');
    }

    // Map raw results to Restaurant type — aggregateRaw returns _id as { $oid: "..." }
    const restaurants = await Promise.all(
      rawRestaurants.map(async (raw: any) => {
        const id = raw._id?.$oid ?? raw._id?.toString();
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id },
          include: {
            menus: true,
            categories: true,
            menuItems: {
              include: {
                images: true,
                optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
              },
            },
            operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
      },
    });

    return {
      message: 'Category deleted successfully',
      restaurant: restaurants[0], // Return first restaurant as example
    };
  }

  // ==================== MENU ITEM MANAGEMENT ====================
  
  async createMenuItem(createMenuItemDto: CreateMenuItemDto, req: AuthenticatedRequest) {
    const { name, description, price, estimatedPrice, calories, categoryId, menuId, available, images } = createMenuItemDto;
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
        calories,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
      },
    });

    return {
      message: 'Menu item created successfully',
      restaurant: updatedRestaurant,
    };
  }

  async updateMenuItem(updateMenuItemDto: UpdateMenuItemDto, req: AuthenticatedRequest) {
    const { id, name, description, price, estimatedPrice, calories, categoryId, menuId, available } = updateMenuItemDto;
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
        calories,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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

    // MongoDB has no referential cascade, so the option catalogue has to be torn
    // down explicitly: options first, then the groups that own them.
    const optionGroups = await this.prisma.optionGroup.findMany({
      where: { menuItemId: id },
      select: { id: true },
    });

    if (optionGroups.length > 0) {
      await this.prisma.itemOption.deleteMany({
        where: { optionGroupId: { in: optionGroups.map(group => group.id) } },
      });
      await this.prisma.optionGroup.deleteMany({
        where: { menuItemId: id },
      });
    }

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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
      },
    });

    return {
      message: 'Menu item deleted successfully',
      restaurant,
    };
  }

  // ==================== OPTION GROUP / ITEM OPTION MANAGEMENT ====================

  /**
   * Public read used by the customer app's item detail sheet. Unlike the owner
   * mutations below it needs no authentication, but it only ever exposes an
   * available item so a hidden item cannot be reached by guessing its id.
   */
  async getMenuItem(getMenuItemDto: GetMenuItemDto) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: getMenuItemDto.menuItemId },
      include: {
        images: true,
        category: true,
        menu: true,
        optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
      },
    });

    if (!menuItem) {
      return { error: { message: 'Menu item not found' } };
    }

    return { menuItem };
  }

  async createOptionGroup(dto: CreateOptionGroupDto, req: AuthenticatedRequest) {
    const restaurantId = this.requireRestaurantId(req);
    const { menuItemId, name, required, minSelect, maxSelect, displayOrder, options } = dto;

    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId },
    });

    if (!menuItem) {
      throw new BadRequestException('Menu item not found or not owned by restaurant');
    }

    const resolved = this.resolveSelectionRules({ required, minSelect, maxSelect });
    const optionCount = options?.length ?? 0;

    if (optionCount > 0 && resolved.maxSelect > optionCount) {
      throw new BadRequestException(
        `maxSelect (${resolved.maxSelect}) cannot exceed the number of options in the group (${optionCount})`,
      );
    }

    const optionGroup = await this.prisma.optionGroup.create({
      data: {
        menuItemId,
        restaurantId,
        name,
        required: resolved.required,
        minSelect: resolved.minSelect,
        maxSelect: resolved.maxSelect,
        displayOrder: displayOrder ?? 0,
        options: options?.length
          ? {
              create: options.map((option, index) => ({
                restaurantId,
                name: option.name,
                priceDelta: option.priceDelta ?? 0,
                available: option.available ?? true,
                displayOrder: option.displayOrder ?? index,
              })),
            }
          : undefined,
      },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    });

    return { message: 'Option group created successfully', optionGroup };
  }

  async updateOptionGroup(dto: UpdateOptionGroupDto, req: AuthenticatedRequest) {
    const restaurantId = this.requireRestaurantId(req);
    const { id, name, required, minSelect, maxSelect, displayOrder } = dto;

    const existing = await this.prisma.optionGroup.findFirst({
      where: { id, restaurantId },
      include: { options: true },
    });

    if (!existing) {
      throw new BadRequestException('Option group not found or not owned by restaurant');
    }

    // Selection rules are validated against the merge of the patch and the stored
    // group, so a partial update cannot leave the group in an unsatisfiable state
    // (e.g. raising minSelect above an unchanged maxSelect).
    const resolved = this.resolveSelectionRules({
      required: required ?? existing.required,
      minSelect: minSelect ?? existing.minSelect,
      maxSelect: maxSelect ?? existing.maxSelect,
    });

    if (existing.options.length > 0 && resolved.maxSelect > existing.options.length) {
      throw new BadRequestException(
        `maxSelect (${resolved.maxSelect}) cannot exceed the number of options in the group (${existing.options.length})`,
      );
    }

    const optionGroup = await this.prisma.optionGroup.update({
      where: { id },
      data: {
        name,
        required: resolved.required,
        minSelect: resolved.minSelect,
        maxSelect: resolved.maxSelect,
        displayOrder,
      },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    });

    return { message: 'Option group updated successfully', optionGroup };
  }

  async deleteOptionGroup(dto: DeleteOptionGroupDto, req: AuthenticatedRequest) {
    const restaurantId = this.requireRestaurantId(req);

    const existing = await this.prisma.optionGroup.findFirst({
      where: { id: dto.id, restaurantId },
    });

    if (!existing) {
      throw new BadRequestException('Option group not found or not owned by restaurant');
    }

    await this.prisma.itemOption.deleteMany({ where: { optionGroupId: dto.id } });
    await this.prisma.optionGroup.delete({ where: { id: dto.id } });

    return { message: 'Option group deleted successfully' };
  }

  async createItemOption(dto: CreateItemOptionDto, req: AuthenticatedRequest) {
    const restaurantId = this.requireRestaurantId(req);
    const { optionGroupId, name, priceDelta, available, displayOrder } = dto;

    const group = await this.prisma.optionGroup.findFirst({
      where: { id: optionGroupId, restaurantId },
      include: { options: { select: { id: true } } },
    });

    if (!group) {
      throw new BadRequestException('Option group not found or not owned by restaurant');
    }

    await this.prisma.itemOption.create({
      data: {
        optionGroupId,
        restaurantId,
        name,
        priceDelta: priceDelta ?? 0,
        available: available ?? true,
        displayOrder: displayOrder ?? group.options.length,
      },
    });

    return {
      message: 'Option created successfully',
      optionGroup: await this.findOwnedOptionGroup(optionGroupId, restaurantId),
    };
  }

  async updateItemOption(dto: UpdateItemOptionDto, req: AuthenticatedRequest) {
    const restaurantId = this.requireRestaurantId(req);
    const { id, name, priceDelta, available, displayOrder } = dto;

    const existing = await this.prisma.itemOption.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new BadRequestException('Option not found or not owned by restaurant');
    }

    await this.prisma.itemOption.update({
      where: { id },
      data: { name, priceDelta, available, displayOrder },
    });

    return {
      message: 'Option updated successfully',
      optionGroup: await this.findOwnedOptionGroup(existing.optionGroupId, restaurantId),
    };
  }

  async deleteItemOption(dto: DeleteItemOptionDto, req: AuthenticatedRequest) {
    const restaurantId = this.requireRestaurantId(req);

    const existing = await this.prisma.itemOption.findFirst({
      where: { id: dto.id, restaurantId },
      include: { optionGroup: true },
    });

    if (!existing) {
      throw new BadRequestException('Option not found or not owned by restaurant');
    }

    // Removing an option can leave the group demanding more choices than it
    // offers, which would make every order for the item fail validation.
    const remaining = await this.prisma.itemOption.count({
      where: { optionGroupId: existing.optionGroupId, id: { not: dto.id } },
    });

    if (existing.optionGroup.required && remaining < existing.optionGroup.minSelect) {
      throw new BadRequestException(
        `Cannot delete option: group "${existing.optionGroup.name}" requires at least ${existing.optionGroup.minSelect} selection(s) and would only have ${remaining} option(s) left`,
      );
    }

    await this.prisma.itemOption.delete({ where: { id: dto.id } });

    return { message: 'Option deleted successfully' };
  }

  private requireRestaurantId(req: AuthenticatedRequest): string {
    const restaurantId = req.restaurant?.id;
    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }
    return restaurantId;
  }

  private async findOwnedOptionGroup(id: string, restaurantId: string) {
    return this.prisma.optionGroup.findFirst({
      where: { id, restaurantId },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    });
  }

  /**
   * Normalizes the three interdependent selection fields into a consistent set.
   * A required group must demand at least one choice, and maxSelect can never be
   * below minSelect — otherwise no selection could ever satisfy the group.
   */
  private resolveSelectionRules(input: {
    required?: boolean;
    minSelect?: number;
    maxSelect?: number;
  }): { required: boolean; minSelect: number; maxSelect: number } {
    const required = input.required ?? false;
    const minSelect = input.minSelect ?? (required ? 1 : 0);
    const maxSelect = input.maxSelect ?? Math.max(1, minSelect);

    if (required && minSelect < 1) {
      throw new BadRequestException('A required option group must have minSelect of at least 1');
    }

    if (maxSelect < minSelect) {
      throw new BadRequestException(
        `maxSelect (${maxSelect}) cannot be less than minSelect (${minSelect})`,
      );
    }

    return { required, minSelect, maxSelect };
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
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

    // Upsert staff assignment in restaurants DB
    await this.prisma.staffMember.upsert({
      where: { restaurantId_userId: { restaurantId, userId } },
      update: { role },
      create: { restaurantId, userId, role },
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
        staffMembers: true,
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

    // No local User record to modify — users service is the source of truth
    // Remove staff assignment from restaurants DB
    await this.prisma.staffMember.deleteMany({
      where: { restaurantId, userId },
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
            optionGroups: MENU_ITEM_OPTION_GROUPS_INCLUDE,
          },
        },
        operatingHours: true,
        staffMembers: true,
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

      const coords = restaurant.coordinates?.coordinates;
      const response = {
        isValid: true,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          email: restaurant.email,
          address: restaurant.address,
          longitude: Array.isArray(coords) ? coords[0] : undefined,
          latitude: Array.isArray(coords) ? coords[1] : undefined,
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

  /**
   * Prices and validates a cart for the Orders Service (RabbitMQ handler).
   *
   * This is the single authority on what a line costs. The caller sends only
   * identifiers and quantities — never money — and gets back the priced lines it
   * must persist. Every price is read from this service's own catalogue, so a
   * client that tampers with prices in its request cannot influence the total.
   *
   * A line is rejected unless the item belongs to this restaurant and is
   * available, and unless the chosen options exist on that item, are available,
   * and satisfy each group's required / minSelect / maxSelect rules.
   */
  async validateMenuItems(data: {
    restaurantId: string;
    items: Array<{ menuItemId: string; quantity: number; selectedOptionIds?: string[] }>;
  }) {
    this.logger.log(`🔍 Pricing and validating menu items for restaurant: ${data.restaurantId}`);

    try {
      if (!data?.restaurantId) {
        return { isValid: false, error: 'Restaurant ID is required', items: [], subtotal: 0 };
      }

      if (!Array.isArray(data.items) || data.items.length === 0) {
        return { isValid: false, error: 'Order must contain at least one item', items: [], subtotal: 0 };
      }

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: data.restaurantId },
        select: { id: true },
      });

      if (!restaurant) {
        return { isValid: false, error: 'Restaurant not found', items: [], subtotal: 0 };
      }

      // Fetch the whole catalogue slice for the requested items in one query so
      // pricing does not issue a database round trip per line.
      const menuItems = await this.prisma.menuItem.findMany({
        where: {
          id: { in: data.items.map(item => item.menuItemId) },
          restaurantId: data.restaurantId,
        },
        include: {
          images: { take: 1 },
          optionGroups: { include: { options: true } },
        },
      });

      const menuItemsById = new Map(menuItems.map(menuItem => [menuItem.id, menuItem]));
      const errors: string[] = [];
      const pricedItems: Array<{
        menuItemId: string;
        menuItemName: string;
        menuItemDescription: string;
        menuItemImage?: string;
        quantity: number;
        basePrice: number;
        optionsTotal: number;
        unitPrice: number;
        totalPrice: number;
        selectedOptions: Array<{
          optionId: string;
          optionGroupId: string;
          groupName: string;
          name: string;
          priceDelta: number;
        }>;
      }> = [];

      for (const item of data.items) {
        const menuItem = menuItemsById.get(item.menuItemId);

        if (!menuItem) {
          errors.push(`Menu item ${item.menuItemId} not found for this restaurant`);
          continue;
        }

        if (!menuItem.available) {
          errors.push(`${menuItem.name} is currently unavailable`);
          continue;
        }

        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
          errors.push(`Invalid quantity for ${menuItem.name}: must be a whole number between 1 and 99`);
          continue;
        }

        const selection = this.priceSelectedOptions(menuItem, item.selectedOptionIds ?? []);

        if (selection.errors.length > 0) {
          errors.push(...selection.errors);
          continue;
        }

        const unitPrice = this.roundMoney(menuItem.price + selection.optionsTotal);

        pricedItems.push({
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          menuItemDescription: menuItem.description,
          menuItemImage: menuItem.images[0]?.url,
          quantity: item.quantity,
          basePrice: menuItem.price,
          optionsTotal: selection.optionsTotal,
          unitPrice,
          totalPrice: this.roundMoney(unitPrice * item.quantity),
          selectedOptions: selection.selectedOptions,
        });
      }

      if (errors.length > 0) {
        this.logger.warn(`⚠️ Menu item validation rejected an order: ${errors.join('; ')}`);
        return { isValid: false, error: errors.join('; '), items: [], subtotal: 0 };
      }

      const subtotal = this.roundMoney(
        pricedItems.reduce((sum, item) => sum + item.totalPrice, 0),
      );

      return { isValid: true, items: pricedItems, subtotal };
    } catch (error) {
      this.logger.error(`❌ Menu items validation failed: ${error.message}`);
      return { isValid: false, error: 'Validation failed', items: [], subtotal: 0 };
    }
  }

  /**
   * Resolves the chosen option ids against a menu item's own option groups and
   * sums their price deltas. Returns the accumulated errors instead of throwing
   * so the caller can report every problem with a cart at once.
   */
  private priceSelectedOptions(
    menuItem: {
      name: string;
      optionGroups: Array<{
        id: string;
        name: string;
        required: boolean;
        minSelect: number;
        maxSelect: number;
        options: Array<{ id: string; name: string; priceDelta: number; available: boolean }>;
      }>;
    },
    selectedOptionIds: string[],
  ) {
    const errors: string[] = [];
    const selectedOptions: Array<{
      optionId: string;
      optionGroupId: string;
      groupName: string;
      name: string;
      priceDelta: number;
    }> = [];

    const uniqueIds = [...new Set(selectedOptionIds)];
    if (uniqueIds.length !== selectedOptionIds.length) {
      errors.push(`Duplicate options selected for ${menuItem.name}`);
    }

    // Index every option this item actually offers, so an id belonging to a
    // different item (or a fabricated one) cannot be priced.
    const optionIndex = new Map(
      menuItem.optionGroups.flatMap(group =>
        group.options.map(option => [option.id, { group, option }] as const),
      ),
    );

    const selectionsPerGroup = new Map<string, number>();

    for (const optionId of uniqueIds) {
      const match = optionIndex.get(optionId);

      if (!match) {
        errors.push(`Option ${optionId} is not available for ${menuItem.name}`);
        continue;
      }

      if (!match.option.available) {
        errors.push(`Option "${match.option.name}" for ${menuItem.name} is currently unavailable`);
        continue;
      }

      selectionsPerGroup.set(match.group.id, (selectionsPerGroup.get(match.group.id) ?? 0) + 1);
      selectedOptions.push({
        optionId: match.option.id,
        optionGroupId: match.group.id,
        groupName: match.group.name,
        name: match.option.name,
        priceDelta: match.option.priceDelta,
      });
    }

    for (const group of menuItem.optionGroups) {
      const count = selectionsPerGroup.get(group.id) ?? 0;

      if (group.required && count < group.minSelect) {
        errors.push(
          `${menuItem.name}: "${group.name}" requires at least ${group.minSelect} selection(s), got ${count}`,
        );
        continue;
      }

      // A group that is not required may be skipped entirely, but once the
      // customer picks anything from it the minimum applies.
      if (!group.required && count > 0 && count < group.minSelect) {
        errors.push(
          `${menuItem.name}: "${group.name}" requires at least ${group.minSelect} selection(s) once used, got ${count}`,
        );
        continue;
      }

      if (count > group.maxSelect) {
        errors.push(
          `${menuItem.name}: "${group.name}" allows at most ${group.maxSelect} selection(s), got ${count}`,
        );
      }
    }

    return {
      errors,
      selectedOptions,
      optionsTotal: this.roundMoney(
        selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0),
      ),
    };
  }

  /** Keeps derived money values at two decimals so floating point drift never reaches a total. */
  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}