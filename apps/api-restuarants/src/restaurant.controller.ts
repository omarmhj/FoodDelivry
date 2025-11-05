import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller()
export class RestaurantController {
  private readonly logger = new Logger(RestaurantController.name);

  constructor(private readonly restaurantService: RestaurantService) {}

  @MessagePattern('restaurant.validate')
  async validateRestaurant(@Payload() data: any) {
    this.logger.log(`Received data: ${JSON.stringify(data)}`);
    const payload = data.restaurantId ? data : (data.data || data);
    return await this.restaurantService.validateRestaurant(payload);
  }

  @MessagePattern('menu.validateItems')
  async validateMenuItems(@Payload() data: any) {
    this.logger.log(`Received data: ${JSON.stringify(data)}`);
    const payload = data.restaurantId ? data : (data.data || data);
    return await this.restaurantService.validateMenuItems(payload);
  }
}


