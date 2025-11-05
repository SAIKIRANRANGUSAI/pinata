import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: any): any {
    return this.authService.signup(body.username, body.password);
  }

  @Post('login')
  login(@Body() body: any): any {
    return this.authService.login(body.username, body.password);
  }
}
