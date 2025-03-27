import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (count === 0) {
      const users = [
        this.repository.create({
          username: 'johndoe',
          email: 'john@doe.com',
          password: '000000',
          displayName: 'John Doe',
          bio: 'I am the son of doe',
          avatar: 'https://doe.com/john.jpg',
        }),
        this.repository.create({
          username: 'janedoe',
          email: 'jane@doe.com',
          password: '000000',
          displayName: 'Jane Doe',
          bio: 'I am the daughter of doe',
          avatar: 'https://doe.com/jane.jpg',
        }),
      ];

      await this.repository.save(users);
      console.log('User seed data inserted successfully');
    } else {
      console.log('User seed data already exists');
    }
  }
}
