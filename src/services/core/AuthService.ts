import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  signOut() {
    return auth.signOut();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

export const authService = AuthService.getInstance();