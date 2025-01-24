import { User as FirebaseUser } from 'firebase/auth';

export interface ExtendedUser extends FirebaseUser {
  role?: UserRole;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}