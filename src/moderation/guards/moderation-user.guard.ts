import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ModerationUserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Moderation access required');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'is_moderation_user'],
    });

    if (!user?.is_moderation_user) {
      throw new ForbiddenException('Moderation access required');
    }

    return true;
  }
}

