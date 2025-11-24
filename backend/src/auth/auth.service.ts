import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { UserWithRelations } from '../users/repositories/users.repository';

export type { UserWithRelations };

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

    // Create user with operator and role
    const newUser = await this.usersService.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      operatorId: registerDto.operatorId,
      roleId: registerDto.roleId,
    });

    // Generate JWT token with operator context
    const token = this.generateToken(newUser);

    return {
      access_token: token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        operatorId: newUser.operatorId,
        roleId: newUser.roleId,
        operator: newUser.operator
          ? {
              id: newUser.operator.id,
              name: newUser.operator.name,
              super: newUser.operator.super ?? false,
            }
          : undefined,
        role: newUser.role || undefined,
      },
    };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserWithRelations | null> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      return null;
    }

    // Check if user account is active
    if ('status' in user && !user.status) {
      return null;
    }

    // Check if operator is active
    if (user.operator && !user.operator.status) {
      return null;
    }

    if (!user.password) {
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

  async login(user: UserWithRelations): Promise<AuthResponseDto> {
    const token = this.generateToken(user);

    // Update lastActivityAt on login to initialize session
    await this.usersService.updateLastActivity(user.id);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        operatorId: user.operatorId,
        roleId: user.roleId,
        operator: user.operator
          ? {
              id: user.operator.id,
              name: user.operator.name,
              super: user.operator.super ?? false,
            }
          : undefined,
        role: user.role || undefined,
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

  private generateToken(user: UserWithRelations): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      operatorId: user.operatorId,
      roleId: user.roleId,
      isSuper: user.operator?.super || false,
    };

    return this.jwtService.sign(payload);
  }
}
