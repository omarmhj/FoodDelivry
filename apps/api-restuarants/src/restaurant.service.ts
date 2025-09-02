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
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
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
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
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
        menuItems: {
          include: {
            images: true,
          },
        },
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
        menuItems: {
          include: {
            images: true,
          },
        },
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
        menuItems: {
          include: {
            images: true,
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
  
  async createMenu(createMenuDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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

  async updateMenu(updateMenuDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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

  async deleteMenu(deleteMenuDto: any, req: any) {
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

    // Delete all menu items in this menu first
    await this.prisma.menuItem.deleteMany({
      where: { menuId: id },
    });

    // Then delete the menu
    await this.prisma.menu.delete({
      where: { id },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        menuItems: {
          include: {
            images: true,
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
  
  async createCategory(createCategoryDto: any, req: any) {
    const { name } = createCategoryDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    const category = await this.prisma.category.create({
      data: { name },
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: restaurantId },
      include: {
        menus: true,
        menuItems: {
          include: {
            images: true,
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

  async updateCategory(updateCategoryDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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

  async deleteCategory(deleteCategoryDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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
  
  async createMenuItem(createMenuItemDto: any, req: any) {
    const { name, description, price, estimatedPrice, categoryId, menuId, available } = createMenuItemDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
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
      },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        menuItems: {
          include: {
            images: true,
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

  async updateMenuItem(updateMenuItemDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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

  async deleteMenuItem(deleteMenuItemDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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
  
  async createOperatingHours(createOperatingHoursDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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

  async updateOperatingHours(updateOperatingHoursDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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

  async deleteOperatingHours(deleteOperatingHoursDto: any, req: any) {
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
        menuItems: {
          include: {
            images: true,
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
  
  async addStaffMember(addStaffMemberDto: any, req: any) {
    const { userId, role } = addStaffMemberDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    // Check if user exists and has appropriate role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role !== 'Staff' && user.role !== 'Owner') {
      throw new BadRequestException('User must have Staff or Owner role');
    }

    // Update user's role if needed
    if (user.role !== role) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role },
      });
    }

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        menuItems: {
          include: {
            images: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Staff member added successfully',
      restaurant: updatedRestaurant,
    };
  }

  async removeStaffMember(removeStaffMemberDto: any, req: any) {
    const { userId } = removeStaffMemberDto;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user's role back to User
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'User' },
    });

    const updatedRestaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menus: true,
        menuItems: {
          include: {
            images: true,
          },
        },
        operatingHours: true,
        owner: true,
      },
    });

    return {
      message: 'Staff member removed successfully',
      restaurant: updatedRestaurant,
    };
  }
}