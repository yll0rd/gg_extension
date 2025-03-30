import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const startTime = Date.now(); // Start benchmark
    this.logger.log('Register method called');

    const { email, username, password } = registerDto;

    // Check if user exists with optimized query fetching only necessary fields
    const existingUser = await this.usersService.findOneByEmail(email, ['id']);
    if (existingUser) {
      this.logger.log('Email already in use');
      throw new ConflictException('Email already in use');
    }

    const existingUsername =
      await this.usersService.findOneByUsername(username, ['id']);
    if (existingUsername) {
      this.logger.log('Username already taken');
      throw new ConflictException('Username already taken');
    }

    // Hash password once and use
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with minimal fields update
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const endTime = Date.now(); // End benchmark
    this.logger.log(`Register method executed in ${endTime - startTime}ms`);

    return {
      user,
      accessToken: this.generateAccessToken(user),
    };
  }

  async login(loginDto: LoginDto) {
    const startTime = Date.now(); // Start benchmark
    this.logger.log('Login method called');

    const { email, password } = loginDto;

    // Optimized to fetch user and password only
    const user = await this.usersService.findOneByEmailWithPassword(email);
    if (!user) {
      this.logger.log('Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.log('Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    const endTime = Date.now(); // End benchmark
    this.logger.log(`Login method executed in ${endTime - startTime}ms`);

    return {
      user,
      accessToken: this.generateAccessToken(user),
    };
  }

  async generateResetToken(email: string) {
    const startTime = Date.now(); // Start benchmark
    this.logger.log('Generate reset token method called');

    const user = await this.usersService.findOneByEmail(email, ['id']);
    if (!user) {
      // Don't reveal if user doesn't exist
      this.logger.log('Email not found for reset token');
      return null;
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('JWT_RESET_SECRET'),
        expiresIn: '1h',
      },
    );

    const endTime = Date.now(); // End benchmark
    this.logger.log(`Generate reset token method executed in ${endTime - startTime}ms`);

    return resetToken;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const startTime = Date.now(); // Start benchmark
    this.logger.log('Reset password method called');

    const { token, newPassword } = resetPasswordDto;

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });

      const userId = payload.sub;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.usersService.update(userId, {
        password: hashedPassword,
      });

      const endTime = Date.now(); // End benchmark
      this.logger.log(`Reset password method executed in ${endTime - startTime}ms`);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      this.logger.log('Invalid or expired token');
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateAccessToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
