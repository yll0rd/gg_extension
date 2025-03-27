export interface IUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate
  extends Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> {
  password: string;
}

export interface IUserUpdate
  extends Partial<Omit<IUserCreate, 'email' | 'username'>> {}
