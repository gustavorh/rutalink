import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { User } from '../database/schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if username already exists
    const existingUserByUsername = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    const existingUserByEmail = await this.usersService.findByEmail(
      registerDto.email,
    );
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create user
    const newUser = await this.usersService.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    // Generate JWT token
    const token = this.generateToken(newUser);

    return {
      access_token: token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    };
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  login(user: User): AuthResponseDto {
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
