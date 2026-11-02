import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService} from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto;

    const existingUser = await this.prisma.users.findUnique({
      where: {
        username: username,
      },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.users.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }
  async validateUser(username: string, password: string) {
  const user = await this.prisma.users.findUnique({
    where: {
      username: username,
    },
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password,
  );

  if (!passwordMatches) {
    return null;
  }

  return user;
 }

  async login(user: any) {
   const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

   return {
    access_token: this.jwtService.sign(payload),
   };
 }
}