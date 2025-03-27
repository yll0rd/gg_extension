import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entity';

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'gasless_gossip',
  entities: [User],
  migrations: ['../database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
};

export const dataSource = new DataSource(options);
export default options;
