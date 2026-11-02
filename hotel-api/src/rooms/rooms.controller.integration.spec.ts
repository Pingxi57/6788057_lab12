import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoomQueryDto } from './dto/room-query.dto';

describe('RoomsController (integration)', () => {
  let controller: RoomsController;

  // Fake service: the controller only needs these methods
  const mockRoomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController], // real
      providers: [{ provide: RoomsService, useValue: mockRoomsService }], // fake
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (ctx, next) => next.handle() })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // POST /rooms
  describe('create', () => {
    it('should call service.create and return the created room', async () => {
      const dto = { name: 'Deluxe', description: 'Sea view', capacity: 2, price_per_night: 1500 };
      const created = { id: 1, ...dto };
      mockRoomsService.create.mockResolvedValue(created);

      expect(await controller.create(dto)).toEqual(created);
      expect(mockRoomsService.create).toHaveBeenCalledWith(dto);
    });
  });

  // GET /rooms
  describe('findAll', () => {
    it('should use default limit=10, offset=0 when query is empty', async () => {
      const page = { data: [{ id: 1, name: 'Deluxe' }], meta: { total: 1, limit: 10, offset: 0 } };
      mockRoomsService.findAll.mockResolvedValue(page);

      const query: RoomQueryDto = {};
      expect(await controller.findAll(query)).toEqual(page);
      expect(mockRoomsService.findAll).toHaveBeenCalledWith(10, 0);
    });

    it('should pass limit and offset from the query to the service', async () => {
      mockRoomsService.findAll.mockResolvedValue({ data: [], meta: { total: 0, limit: 5, offset: 20 } });

      const query: RoomQueryDto = { limit: 5, offset: 20 };
      await controller.findAll(query);
      expect(mockRoomsService.findAll).toHaveBeenCalledWith(5, 20);
    });
  });

  // GET /rooms/:id
  describe('findOne', () => {
    it('should convert id to number and return the room', async () => {
      const room = { id: 1, name: 'Deluxe' };
      mockRoomsService.findOne.mockResolvedValue(room);

      expect(await controller.findOne('1')).toEqual(room);
      expect(mockRoomsService.findOne).toHaveBeenCalledWith(1); // '1' -> 1
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRoomsService.findOne.mockRejectedValue(new NotFoundException('Room 999 not found'));

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  // PUT /rooms/:id
  describe('update', () => {
    it('should call service.update with correct id and dto', async () => {
      const dto = { name: 'Deluxe Plus' };
      const updated = { id: 1, ...dto };
      mockRoomsService.update.mockResolvedValue(updated);

      expect(await controller.update('1', dto)).toEqual(updated);
      expect(mockRoomsService.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException if service throws P2025', async () => {
      const error = Object.assign(new Error('Record to update not found.'), { code: 'P2025' });
      mockRoomsService.update.mockRejectedValue(error);

      await expect(controller.update('999', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  // DELETE /rooms/:id
  describe('remove', () => {
    it('should call service.remove with correct id', async () => {
      const deleted = { success: true, message: 'Room 1 deleted successfully' };
      mockRoomsService.remove.mockResolvedValue(deleted);

      expect(await controller.remove('1')).toEqual(deleted);
      expect(mockRoomsService.remove).toHaveBeenCalledWith(1);
    });

    it('should pass through NotFoundException from the service', async () => {
      mockRoomsService.remove.mockRejectedValue(new NotFoundException('Room 999 not found'));

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if service throws P2025', async () => {
      const error = Object.assign(new Error('Record to delete does not exist.'), { code: 'P2025' });
      mockRoomsService.remove.mockRejectedValue(error);

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('should rethrow other errors unchanged', async () => {
      mockRoomsService.remove.mockRejectedValue(new Error('DB down'));

      await expect(controller.remove('1')).rejects.toThrow('DB down');
    });
  });
});
