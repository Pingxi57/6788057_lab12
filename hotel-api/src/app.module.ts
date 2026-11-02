import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => ({
    stores: [
      createKeyv(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    ],
    ttl: 300000, // 5 minutes
  }),
}),

ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 600000, // 1 minute
      limit: 100000,  // 30 requests
    },
  ],
}),

    PrismaModule, RoomsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
