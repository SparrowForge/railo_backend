import { PartialType } from '@nestjs/swagger';
import { CreateBoostPackageDto } from './create-boost-package.dto';

export class UpdateBoostPackageDto extends PartialType(CreateBoostPackageDto) { }
