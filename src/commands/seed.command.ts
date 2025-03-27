import { Command, Console } from 'nestjs-console';
import { UserSeedService } from '../database/seeds/user.seed';

@Console()
export class SeedCommand {
  constructor(private readonly userSeedService: UserSeedService) {}

  @Command({
    command: 'seed:users',
    description: 'Seed users into the database',
  })
  async execute(): Promise<void> {
    await this.seedUsers();
  }

  private async seedUsers(): Promise<void> {
    await this.userSeedService.run();
  }
}
