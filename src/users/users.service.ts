import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersRepository.findOneByUsername(
      createUserDto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.usersRepository.create(createUserDto);
    return new UserResponseDto(user);
  }

  async findOne(id: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOneById(id);
    return !user ? null : new UserResponseDto(user);
  }

  async findOneByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOneByEmail(email);
    return !user ? null : new UserResponseDto(user);
  }

  async findOneByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOneByUsername(username);
    return !user ? null : new UserResponseDto(user);
  }

  async findOneByEmailWithPassword(email: string): Promise<User|null> {
    const user = await this.usersRepository.findOneByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.delete(id);
  }
}
