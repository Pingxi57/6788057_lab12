import 'reflect-metadata';
import { Body, Controller, Get, HttpException, Injectable, Module, OnApplicationShutdown, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Pool } from 'pg';

@Injectable()
class DatabaseService implements OnApplicationShutdown {
  readonly pool = new Pool({ max: 5, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000 });
  constructor() {
    this.pool.on('error', () => console.warn('Database connection interrupted; a later request will reconnect.'));
  }
  async onApplicationShutdown() { await this.pool.end(); }
}

@Controller()
class AppController {
  constructor(private readonly database: DatabaseService) {}
  @Get()
  home() { return { message: 'Lab 12: NestJS + PostgreSQL', lab: 12 }; }
  @Get('health')
  async health() {
    try {
      await this.database.pool.query('SELECT 1');
      return { status: 'ok', database: 'connected', framework: 'nestjs' };
    } catch {
      throw new HttpException({ status: 'error', database: 'unavailable', framework: 'nestjs' }, 503);
    }
  }
  @Get('notes')
  async notes() {
    try {
      const result = await this.database.pool.query('SELECT id, student_id, body, created_at FROM notes ORDER BY id LIMIT 1000');
      return result.rows;
    } catch {
      throw new HttpException({ error: 'Database unavailable; retry after it recovers.' }, 503);
    }
  }
  @Post('notes')
  async createNote(@Body() input: unknown) {
    const value = input && typeof input === 'object' ? input as Record<string, unknown> : {};
    const studentId = typeof value.student_id === 'string' ? value.student_id.trim() : '';
    const body = typeof value.body === 'string' ? value.body.trim() : '';
    if (!/^[A-Za-z0-9_-]{1,30}$/.test(studentId) || body.length < 1 || body.length > 200) {
      throw new HttpException({ error: 'Use student_id (1-30 letters/digits/_/-) and body (1-200 characters).' }, 400);
    }
    try {
      const result = await this.database.pool.query(
        'INSERT INTO notes (student_id, body) VALUES ($1, $2) RETURNING id, student_id, body, created_at',
        [studentId, body]
      );
      return result.rows[0];
    } catch {
      throw new HttpException({ error: 'Database unavailable; retry after it recovers.' }, 503);
    }
  }
}

@Module({ controllers: [AppController], providers: [DatabaseService] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const database = app.get(DatabaseService);
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      await database.pool.query('SELECT 1');
      const port = Number(process.env.PORT || 3000);
      await app.listen(port, '0.0.0.0');
      console.log(`NestJS listening on port ${port}; database ready.`);
      return;
    } catch {
      if (attempt === 15) { await app.close(); throw new Error('Database startup retry budget exceeded.'); }
      console.log(`Waiting for database (${attempt}/15).`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
bootstrap().catch(() => { console.error('Startup failed: check database service and PG environment variables.'); process.exit(1); });
