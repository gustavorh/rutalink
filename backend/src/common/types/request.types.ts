import { Request } from 'express';

/**
 * Authenticated user information extracted from JWT token
 * Matches the structure returned by JwtStrategy.validate()
 */
export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  operatorId: number;
  roleId: number;
  isSuper: boolean;
}

/**
 * Extended Express Request with authenticated user
 */
export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
