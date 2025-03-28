import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findOneByEmail: jest.fn(),
            findOneByUsername: jest.fn(),
            create: jest.fn(),
            findOneById: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: '',
      };
      const user: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: '',
        settings: {},
        password: '',
        displayName: '',
        bio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: function (): Promise<boolean> {
          throw new Error('Function not implemented.');
        },
      };

      jest.spyOn(repository, 'findOneByEmail').mockResolvedValue(null);
      jest.spyOn(repository, 'findOneByUsername').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(user);

      await expect(service.create(createUserDto)).resolves.toEqual(user);
    });

    it('should throw ConflictException if email is taken', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: '',
      };

      jest.spyOn(repository, 'findOneByEmail').mockResolvedValue({});

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: '',
        settings: {},
      };
      const updateUserDto: UpdateUserDto = { username: 'updatedUser' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(user);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...user, ...updateUserDto });

      await expect(service.updateProfile(1, updateUserDto)).resolves.toEqual({
        ...user,
        ...updateUserDto,
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(service.updateProfile(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      jest.spyOn(repository, 'findOneById').mockResolvedValue({});
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      await expect(service.remove('1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(repository, 'findOneById').mockResolvedValue(null);
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
