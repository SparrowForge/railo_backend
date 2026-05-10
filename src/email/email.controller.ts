import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { EmailService } from 'src/auth/email.service';
import { SendWelcomeEmailDto } from './dto/send-welcome-email.dto';
import { SendVarificationEmailDto } from './dto/send-verification-email.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailHeaderKeyGuard } from './email-header-key.guard';

@ApiTags('Email')
@Controller('api/v1/email')
@Public()
@UseGuards(EmailHeaderKeyGuard)
@ApiHeader({
  name: 'x-email-key',
  description: 'Email sending endpoint access key',
  required: true,
})
export class EmailController {
  constructor(private emailService: EmailService) { }

  @Post('send-welcome-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendWelcomeEmail(@Body() dto: SendWelcomeEmailDto): Promise<BaseResponseDto<any>> {
    console.log('api call receive to send a welcome email')
    await this.emailService.sendWelcomeEmail(
      dto.email,
      dto.name,
    );
    return new BaseResponseDto(null, 'Email sent successfully');
  }

  @Post('send-varificatio-code-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Vrification code email sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendVerificationCode(@Body() dto: SendVarificationEmailDto): Promise<BaseResponseDto<any>> {
    await this.emailService.sendVerificationCode(dto.email, dto.code);
    return new BaseResponseDto(null, 'Vrification code email sent successfully');
  }

  @Post('re-send-verificatio-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Vrification email re-send successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerificationEmail(@Body() dto: SendWelcomeEmailDto): Promise<BaseResponseDto<any>> {
    await this.emailService.sendWelcomeEmail(
      dto.email,
      dto.name,
    );
    return new BaseResponseDto(null, 'Vrification email re-send successfully');
  }

}
