/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
import { Express } from 'express';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    return user ? new UserResponseDto(user) : null;
  }

  async findOneByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOneByEmail(email);
    return user ? new UserResponseDto(user) : null;
  }

  async findOneByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOneByUsername(username);
    return user ? new UserResponseDto(user) : null;
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOneByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateUserDto,
  ): Promise<User> {
    const user = (await this.usersRepository.findOne({
      where: { id: userId },
    })) as User | null;
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, updateProfileDto);
    return this.usersRepository.save(user) as User;
  }

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File & { buffer: Buffer },
  ): Promise<User> {
    const user = (await this.usersRepository.findOne({
      where: { id: userId },
    })) as User | null;
    if (!user) throw new NotFoundException('User not found');

    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = join(__dirname, '..', '..', 'uploads', fileName);

    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.write(file.buffer);
      writeStream.end();
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    user.avatar = `/uploads/${fileName}`;
    return this.usersRepository.save(user) as User;
  }

  async updateSettings(
    userId: number,
    settingsDto: Record<string, unknown>,
  ): Promise<User> {
    const user = (await this.usersRepository.findOne({
      where: { id: userId },
    })) as User | null;
    if (!user) throw new NotFoundException('User not found');

    user.settings = { ...user.settings, ...settingsDto } as Record<
      string,
      unknown
    >;
    return this.usersRepository.save(user) as User;
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.delete(id);
  }
}
