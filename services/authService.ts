
import { UserRole } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  orgId: string;
  provider: 'email' | 'google' | 'apple' | 'microsoft';
  isMfaVerified: boolean;
}

let lastGeneratedCode: string | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  login: async (email: string, pass: string): Promise<{ success: boolean; requiresMfa: boolean; user?: User; code?: string }> => {
    await delay(1200);
    if (pass === 'error') throw new Error("Invalid credentials provided.");
    
    lastGeneratedCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    return {
      success: true,
      requiresMfa: true, 
      code: lastGeneratedCode,
      user: {
        id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        email,
        name: email.split('@')[0].toUpperCase(),
        role: UserRole.SUPERVISOR, // Default for demo
        orgId: 'ORG-ENTERPRISE-ALPHA',
        provider: 'email',
        isMfaVerified: false
      }
    };
  },

  signup: async (name: string, email: string, pass: string): Promise<{ user: User, code: string }> => {
    await delay(1500);
    lastGeneratedCode = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      user: {
        id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        email,
        name,
        role: UserRole.INSPECTOR,
        orgId: 'ORG-ENTERPRISE-BETA',
        provider: 'email',
        isMfaVerified: false
      },
      code: lastGeneratedCode
    };
  },

  socialLogin: async (provider: 'google' | 'apple' | 'microsoft'): Promise<User> => {
    await delay(1000);
    return {
      id: 'SOC-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      email: `${provider}_user@enterprise.com`,
      name: `${provider.toUpperCase()} USER`,
      role: UserRole.INSPECTOR,
      orgId: 'ORG-SOCIAL-DOCK',
      provider,
      isMfaVerified: true 
    };
  },

  verifyMfa: async (code: string): Promise<boolean> => {
    await delay(800);
    return code === lastGeneratedCode;
  },

  resendCode: async (): Promise<string> => {
    await delay(1000);
    lastGeneratedCode = Math.floor(100000 + Math.random() * 900000).toString();
    return lastGeneratedCode;
  }
};
