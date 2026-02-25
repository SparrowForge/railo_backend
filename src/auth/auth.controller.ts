import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';

import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { GoogleAuthService } from './google-auth.service';
import { UsersService } from 'src/users/users.service';
import { RolesEnum } from 'src/common/enums/role.enum';
import { generateRandomHashedPassword } from './../lib/random-password';
import { AppleAuthService } from './apple-auth.service';

@ApiTags('Auth')
@Controller('api/v1/auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly appleAuthService: AppleAuthService,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      return this.authService.register(createUserDto);
    } catch (error) {
      console.log(error);
      throw new BadRequestException("Some error happened during registration. Please try again later.")
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<BaseResponseDto<any>> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshToken(
    @Body('refresh_token') token: string,
  ): Promise<BaseResponseDto<any>> {
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(
    @Body('refresh_token') token: string,
  ): Promise<BaseResponseDto<any>> {
    return this.authService.logout(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset - Step 1' })
  @ApiResponse({
    status: 200,
    description: 'If email exists, verification code sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid email format',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<BaseResponseDto<any>> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset code - Step 2' })
  @ApiResponse({
    status: 200,
    description: 'Verification code is valid',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  async verifyResetCode(
    @Body() verifyCodeDto: VerifyCodeDto,
  ): Promise<BaseResponseDto<any>> {
    return this.authService.verifyResetCode(verifyCodeDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verification code - Step 3' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or passwords do not match',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<BaseResponseDto<any>> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('google/mobile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Mobile Login' })
  @ApiResponse({ status: 200, description: 'Google verified ✅' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async googleMobileLogin(@Body() body: { idToken: string }) {
    try {
      const userInfo = await this.googleAuthService.verifyGoogleIdToken(body.idToken);

      // 1) find user by email
      const user = await this.usersService.findByEmailOrPhoneNumberOrUserName(userInfo.email);

      // 2) create user if not exists
      if (!user) {
        const hashedPassword = await generateRandomHashedPassword();
        const newUser = await this.authService.register({
          name: userInfo.name!,
          email: userInfo.email,
          password: hashedPassword,
          role: RolesEnum.user,
          user_name: userInfo.name!,
          display_name: userInfo.name!,
          phone_no: '+0991'
        });
        console.log('New user created:', newUser);
        return await this.authService.login(userInfo.email, hashedPassword);
      } else {
        // 3) generate access/refresh token and return
        return await this.authService.login(userInfo.email, user.password);
      }
    } catch (error) {
      console.log(error)
      return new BadRequestException("Invalid Google token");
    }
  }

  @Post('apple/mobile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apple Mobile Login' })
  @ApiResponse({ status: 200, description: 'Apple verified ✅' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async appleMobileLogin(@Body() body: { identityToken: string }) {
    try {
      const userInfo = await this.appleAuthService.verifyAppleIdToken(
        body.identityToken,
      );
      console.log('Apple user info:', userInfo);

      // ✅ Apple email is not always available after first login
      if (!userInfo.email) {
        // If you want to support this, you must store appleId in DB and login via appleId
        // For now we stop here to avoid creating user without email
        throw new BadRequestException(
          'Apple did not provide email. Please login again or use email login.',
        );
      }

      // 1) find user by email
      const user = await this.usersService.findByEmailOrPhoneNumberOrUserName(userInfo.email);

      // 2) create user if not exists
      if (!user) {
        const hashedPassword = await generateRandomHashedPassword();

        const newUser = await this.authService.register({
          name: 'Apple User', // Apple doesn't provide full name in token
          email: userInfo.email,
          password: hashedPassword,
          role: RolesEnum.user,
          created_by: '',
          user_name: '',
          display_name: 'Apple User',
          phone_no: '+0991'
        });

        console.log('New Apple user created:', newUser);
        return await this.authService.login(userInfo.email, hashedPassword);
      } else {
        // 3) generate access/refresh token and return
        return await this.authService.login(userInfo.email, user.password);
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Invalid Apple token');
    }
  }




}
