import { Module } from '@nestjs/common';
import { JwtModule} from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: {
        expiresIn: '1h',
      },
    }),
    PrismaModule,
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService,JwtModule, JwtAuthGuard],
})
export class AuthModule {}
