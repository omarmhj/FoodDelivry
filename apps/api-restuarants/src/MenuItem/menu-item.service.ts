// apps/api-restaurants/src/foods/menu-item.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/api-restuarants/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateMenuItemDto, DeleteMenuItemDto } from './dto/menu-item.dto';

type Images = { public_id: string; url: string };
type MenuItem = {
  name: string;
  description: string;
  price: number;
  estimatedPrice: number;
  categoryId: string;
  menuId?: string;
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
      throw new Error('Restaurant not authenticated');
    }

    let menuItemImages: Images[] = [];
    for (const image of images) {
      if (typeof image === 'string') {
        const data = await this.cloudinaryService.upload(image);
        menuItemImages.push({
          public_id: data.public_id,
          url: data.secure_url,
        });
      }
    }

    const menuItemData = {
      name,
      description,
      price,
      estimatedPrice,
      categoryId,
      menuId,
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
      throw new Error('Only restaurant owner can delete menu item!');
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