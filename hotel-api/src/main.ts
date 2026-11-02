import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConsoleLogger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; 

async function bootstrap() {
   const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
        prefix: 'nest-lab',
        }),
    });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Hotel Booking System API')
    .setDescription([
      'API for the Hotel Booking System.',
      '',
      '- **Rooms**: create, list, view, enable/disable and delete hotel rooms.',
      '- **Bookings**: manage room reservations made by guests.',
      '',
      '**Rate limiting:** 100 requests per minute per client.',
      'Exceeding the limit returns `429 Too Many Requests`.',
    ].join('\n'))
    .setVersion('1.0.0')
    .addTag('rooms', 'Hotel room management')
    .addTag('bookings', 'Room booking management')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
        description: 'Use: Authorization: Bearer <access_token>', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
