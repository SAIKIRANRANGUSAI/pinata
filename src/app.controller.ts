import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index') // Render index.ejs
  showHome() {
    return {}; // no data needed for now
  }
}
