import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('user.validate')
  async validateUser(@Payload() data: any) {
    this.logger.log(`Received data: ${JSON.stringify(data)}`);
    const payload = data.userId ? data : (data.data || data);
    return await this.usersService.validateUser(payload);
  }

  @MessagePattern('user.get_by_id')
  async getUserById(@Payload() data: any) {
    this.logger.log(`Received data: ${JSON.stringify(data)}`);
    const payload = data.userId ? data : (data.data || data);
    return await this.usersService.getUserById(payload);
  }
}

