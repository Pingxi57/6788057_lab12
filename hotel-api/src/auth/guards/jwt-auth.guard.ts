import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,           
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing access token');      
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');      // ③ เดิม: return false;
    }

    try {
      const payload = this.jwtService.verify(token);

      const user = await this.prisma.users.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');          // ④ เดิม: return false;
      }

      request.user = {
        id: user.id,
        username: user.username,
        role: payload.role,
      };

      return true;            
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');  // ⑤ เดิม: return false;
    }
  }
}