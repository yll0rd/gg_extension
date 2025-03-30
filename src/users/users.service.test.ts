// users.service.bench.ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UsersService Performance', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UsersRepository),
          useValue: {
            findOne: jest.fn(),
            findOneByEmail: jest.fn(),
            findOneByUsername: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should perform email lookup within 20ms', async () => {
    const mockUser = new User();
    mockUser.id = 1;
    mockUser.email = 'test@example.com';

    const repo = module.get(getRepositoryToken(UsersRepository));
    repo.findOneByEmail.mockResolvedValue(mockUser);

    const start = performance.now();
    await service.findOneByEmail('test@example.com');
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(20);
  });
});
