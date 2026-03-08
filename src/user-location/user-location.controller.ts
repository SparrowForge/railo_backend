import { Controller } from '@nestjs/common';
import { UserLocationService } from './user-location.service';

@Controller('user-location')
export class UserLocationController {
    constructor(private readonly userLocationService: UserLocationService) { }


}
