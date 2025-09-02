// apps/api-restaurants/src/foods/menu-item.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateMenuItemDto, DeleteMenuItemDto } from './dto/menu-item.dto';

type Images = { public_id: string; url: string };
type MenuItem = {
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  categoryId?: string;
  menuId?: string;
  available?: boolean;
  images: Images[] | any;
};

@Injectable()
export class MenuItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createMenuItem(createMenuItemDto: CreateMenuItemDto, req: any) {
    const { name, description, price, estimatedPrice, categoryId, menuId, images } = createMenuItemDto as MenuItem;
    const restaurantId = req.restaurant?.id;

    if (!restaurantId) {
      throw new BadRequestException('Restaurant not authenticated');
    }

    let menuItemImages: Images[] = [];
    if (images && images.length > 0) {
      const uploadResults = await this.cloudinaryService.uploadMultiple(images, 'menu-items');
      menuItemImages = uploadResults.map(result => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
    }

    const menuItemData = {
      name,
      description,
      price,
      estimatedPrice,
      categoryId,
      menuId,
      available: true,
      images: {
        create: menuItemImages.map((image: { public_id: string; url: string }) => ({
          public_id: image.public_id,
          url: image.url,
        })),
      },
      restaurantId,
    };

    await this.prisma.menuItem.create({
      data: menuItemData,
    });

    return { message: 'Menu Item Created Successfully!' };
  }

  async getLoggedInRestaurantMenuItems(req: any) {
    const restaurantId = req.restaurant?.id;

    const menuItems = await this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: { images: true, restaurant: true, category: true, menu: true },
      orderBy: { createdAt: 'desc' },
    });
    return { menuItems };
  }

  async deleteMenuItem(deleteMenuItemDto: DeleteMenuItemDto, req: any) {
    const restaurantId = req.restaurant?.id;

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: deleteMenuItemDto.id },
      include: { restaurant: true, images: true },
    });

    if (!menuItem || menuItem.restaurant.id !== restaurantId) {
      throw new BadRequestException('Only restaurant owner can delete menu item!');
    }

    // Delete associated images from Cloudinary and database
    if (menuItem.images && menuItem.images.length > 0) {
      const publicIds = menuItem.images.map(img => img.public_id);
      await this.cloudinaryService.deleteMultipleImages(publicIds);
    }
    
    await this.prisma.images.deleteMany({
      where: { foodId: deleteMenuItemDto.id },
    });

    await this.prisma.menuItem.delete({
      where: { id: deleteMenuItemDto.id },
    });

    return { message: 'Menu Item Deleted Successfully!' };
  }
}