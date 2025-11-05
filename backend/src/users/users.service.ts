import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import { users, User, NewUser } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  async findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findById(id: number): Promise<User> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));

    return user;
  }

  async create(newUser: NewUser): Promise<User> {
    const [insertedUser] = await this.db
      .insert(users)
      .values(newUser)
      .$returningId();

    return this.findById(insertedUser.id);
  }

  async update(id: number, userData: Partial<NewUser>): Promise<User> {
    await this.findById(id); // Check if user exists

    await this.db.update(users).set(userData).where(eq(users.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id); // Check if user exists

    await this.db.delete(users).where(eq(users.id, id));
  }
}
