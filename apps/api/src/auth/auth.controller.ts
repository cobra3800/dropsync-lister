import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
async login(
  @Body() body: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.authService.login(body);

  res.cookie('dropsync_session', result.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    success: result.success,
    message: result.message,
    user: result.user,
  };
}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return {
      success: true,
      user: req.user,
    };
  }
}