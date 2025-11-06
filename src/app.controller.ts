import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    // Pass variables to HBS template
    return {
      title: '📦 Decentralized Storage Hub | Welcome',
      subtitle: 'Unified Dashboard for Pinata, Walrus & Tusky',
      currentYear: new Date().getFullYear(),
    };
  }
}
