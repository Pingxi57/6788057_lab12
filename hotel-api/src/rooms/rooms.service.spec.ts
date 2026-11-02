import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RoomsService (unit)', () => {
  let service: RoomsService;

  // Fake Prisma: same shape as this.prisma.rooms.xxx() in the real service
  const mockPrismaService = {
    rooms: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService, // real
        { provide: PrismaService, useValue: mockPrismaService }, // fake
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks(); // reset call counts between tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // create 
  describe('create', () => {
    it('should create a room and default is_active to true', async () => {
      const dto = { name: 'Deluxe', description: 'Sea view', capacity: 2, price_per_night: 1500 };
      const created = { id: 1, ...dto, image_url: null, is_active: true };
      mockPrismaService.rooms.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockPrismaService.rooms.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Deluxe',
          capacity: 2,
          price_per_night: 1500,
          is_active: true,
        }),
      });
    });

    it('should rethrow when the database fails', async () => {
      const dto = { name: 'Deluxe', capacity: 2, price_per_night: 1500 };
      mockPrismaService.rooms.create.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto)).rejects.toThrow('DB error');
    });
  });

  // findAll 
  describe('findAll', () => {
    it('should return rooms with pagination meta (default limit=10, offset=0)', async () => {
      const rooms = [
        { id: 1, name: 'Deluxe' },
        { id: 2, name: 'Suite' },
      ];
      mockPrismaService.rooms.findMany.mockResolvedValue(rooms);
      mockPrismaService.rooms.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(result).toEqual({ data: rooms, meta: { total: 2, limit: 10, offset: 0 } });
      expect(mockPrismaService.rooms.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { id: 'asc' },
      });
    });

    it('should pass limit and offset to prisma as take and skip', async () => {
      mockPrismaService.rooms.findMany.mockResolvedValue([]);
      mockPrismaService.rooms.count.mockResolvedValue(25);

      const result = await service.findAll(5, 20);

      expect(result.meta).toEqual({ total: 25, limit: 5, offset: 20 });
      expect(mockPrismaService.rooms.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 5 }),
      );
    });
  });

  // ---------------- findOne ----------------
  describe('findOne', () => {
    it('should return the room when found', async () => {
      const room = { id: 1, name: 'Deluxe' };
      mockPrismaService.rooms.findUnique.mockResolvedValue(room);

      expect(await service.findOne(1)).toEqual(room);
      expect(mockPrismaService.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockPrismaService.rooms.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // update
  describe('update', () => {
    it('should call prisma.update with correct id and data', async () => {
      const dto = { name: 'Deluxe Plus', price_per_night: 1800 };
      const updated = { id: 1, ...dto };
      mockPrismaService.rooms.findUnique.mockResolvedValue({ id: 1, name: 'Deluxe' }); // room exists
      mockPrismaService.rooms.update.mockResolvedValue(updated);

      expect(await service.update(1, dto)).toEqual(updated);
      expect(mockPrismaService.rooms.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
    });

    it('should throw NotFoundException and NOT call update when room is missing', async () => {
      mockPrismaService.rooms.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'x' })).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.rooms.update).not.toHaveBeenCalled();
    });
  });

  // remove 
  describe('remove', () => {
    it('should delete the room and return a success message', async () => {
      mockPrismaService.rooms.findUnique.mockResolvedValue({ id: 1, name: 'Deluxe' }); // room exists
      mockPrismaService.rooms.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ success: true, message: 'Room 1 deleted successfully' });
      expect(mockPrismaService.rooms.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException and NOT call delete when room is missing', async () => {
      mockPrismaService.rooms.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.rooms.delete).not.toHaveBeenCalled();
    });

    it('should rethrow database errors from delete', async () => {
      mockPrismaService.rooms.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.rooms.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.remove(1)).rejects.toThrow('DB error');
    });
  });
});
