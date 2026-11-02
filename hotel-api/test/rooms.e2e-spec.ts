/*
AI Declaration:
[เขียนเองตามจริง]

Reflection:
[เขียนเองตามจริง]
*/
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Rooms API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let roomId: number;

  const admin = { username: 'e2e_admin', password: 'admin1234' };

  // Fake cache: always "miss", so we never talk to Redis
  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCacheManager)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // must match main.ts
    await app.init();

    prisma = moduleRef.get(PrismaService);

    // Seed an ADMIN user (upsert = create if missing, update if exists)
    const hashed = await bcrypt.hash(admin.password, 10);
    await prisma.users.upsert({
      where: { username: admin.username },
      update: { password: hashed, role: Role.ADMIN },
      create: { username: admin.username, password: hashed, role: Role.ADMIN },
    });

    // Login to get a real JWT
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(admin)
      .expect(201);
    accessToken = res.body.access_token;
  });

  afterAll(async () => {
    if (roomId) {
      await prisma.rooms.deleteMany({ where: { id: roomId } });
    }
    await prisma.users.deleteMany({ where: { username: admin.username } });
    await app.close();
  });

  it('POST /rooms -> 201 creates a room', async () => {
    const res = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Room', description: 'test', capacity: 2, price_per_night: 1500 })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('E2E Room');
    roomId = res.body.id; // keep for next tests
  });

  it('POST /rooms without token -> 401', () => {
    return request(app.getHttpServer())
      .post('/rooms')
      .send({ name: 'No Token', capacity: 1, price_per_night: 100 })
      .expect(401);
  });

  it('GET /rooms -> 200 and contains the new room', async () => {
    const res = await request(app.getHttpServer())
      .get('/rooms?limit=100') // max page size, so the new room is included
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Lab 9 response shape: { data: [...], meta: { total, limit, offset } }
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.limit).toBe(100);
    expect(res.body.data.some((r) => r.id === roomId)).toBe(true);
  });

  it('GET /rooms/:id -> 200 returns that room', async () => {
    const res = await request(app.getHttpServer())
      .get(`/rooms/${roomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(roomId);
    expect(res.body.name).toBe('E2E Room');
    expect(Number(res.body.price_per_night)).toBe(1500); // Decimal comes back as string
  });

  it('PUT /rooms/:id -> 200 updates the room', async () => {
    const res = await request(app.getHttpServer())
      .put(`/rooms/${roomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Room Updated', price_per_night: 1800 })
      .expect(200);

    expect(res.body.name).toBe('E2E Room Updated');
    expect(Number(res.body.price_per_night)).toBe(1800);
  });

  it('PUT /rooms/:id with unknown id -> 404', () => {
    return request(app.getHttpServer())
      .put('/rooms/999999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('DELETE /rooms/:id -> 200', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/rooms/${roomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('GET /rooms/:id after delete -> 404', () => {
    return request(app.getHttpServer())
      .get(`/rooms/${roomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
