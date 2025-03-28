/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { createWriteStream } from 'fs';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  avatar: null,
  settings: {},
};

const mockUsersRepository: jest.Mocked<UsersRepository> = {
  findOne: jest.fn().mockResolvedValue(mockUser),
  save: jest.fn().mockImplementation((user: User) => Promise.resolve(user)),
  create: jest
    .fn()
    .mockImplementation((userData: Partial<User>) =>
      Promise.resolve({ ...mockUser, ...userData }),
    ),
  findOneById: jest.fn().mockResolvedValue(mockUser),
  findOneByEmail: jest.fn().mockResolvedValue(mockUser),
  findOneByUsername: jest.fn().mockResolvedValue(mockUser),
  findAll: jest.fn().mockResolvedValue([mockUser]),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
};

describe('UsersService - Profile Management', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>; // Explicitly typed to avoid unsafe access

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(
      UsersRepository,
    ) as jest.Mocked<UsersRepository>;
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateDto: UpdateUserDto = { username: 'newUsername' };
      const updatedUser = { ...mockUser, ...updateDto };
      (usersRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateDto);
      expect(result).toEqual(updatedUser);
      expect(usersRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfile(99, { username: 'newUser' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload an avatar and update user', async () => {
      const file = {
        originalname: 'avatar.png',
        buffer: Buffer.from(''),
      } as Express.Multer.File;
      const fileName = `${uuidv4()}-${file.originalname}`;
      const filePath = join(__dirname, '..', '..', 'uploads', fileName);

      jest.spyOn(createWriteStream(filePath), 'write').mockImplementation();
      jest.spyOn(createWriteStream(filePath), 'end').mockImplementation();

      const updatedUser = { ...mockUser, avatar: `/uploads/${fileName}` };
      usersRepository.save.mockResolvedValue(updatedUser);

      const result = await service.uploadAvatar(mockUser.id, file);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateSettings', () => {
    it('should update user settings successfully', async () => {
      const newSettings = { theme: 'dark' };
      const updatedUser = { ...mockUser, settings: newSettings };
      usersRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateSettings(mockUser.id, newSettings);
      expect(result).toEqual(updatedUser);
      expect(usersRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateSettings(99, { theme: 'dark' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
