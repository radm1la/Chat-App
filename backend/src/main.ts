import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
  });

  await app.listen(3000);
}
bootstrap();