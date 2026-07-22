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
    this.logger.log(`[user.validate] ← REQUEST: ${JSON.stringify(data)}`);
    const payload = data.userId ? data : (data.data || data);
    const result = await this.usersService.validateUser(payload);
    this.logger.log(`[user.validate] → RESPONSE: ${JSON.stringify(result)}`);
    return result;
  }

  @MessagePattern('user.get_by_id')
  async getUserById(@Payload() data: any) {
    this.logger.log(`[user.get_by_id] ← REQUEST: ${JSON.stringify(data)}`);
    const payload = data.userId ? data : (data.data || data);
    const result = await this.usersService.getUserById(payload);
    this.logger.log(`[user.get_by_id] → RESPONSE: ${JSON.stringify(result)}`);
    return result;
  }
}

