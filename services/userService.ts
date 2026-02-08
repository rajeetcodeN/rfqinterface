import { User } from '../types';

// Mock database
let USERS: User[] = [
  {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@enterprise.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2023-01-15'
  },
  {
    id: 'u-2',
    name: 'John Doe',
    email: 'user@enterprise.com',
    role: 'user',
    status: 'active',
    joinedDate: '2023-03-10'
  },
  {
    id: 'u-3',
    name: 'Sarah Smith',
    email: 'sarah@enterprise.com',
    role: 'user',
    status: 'active',
    joinedDate: '2023-06-22'
  }
];

export const loginUser = (email: string): User | null => {
  const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
};

export const getUsers = (): User[] => {
  return [...USERS];
};

export const inviteUser = (email: string, role: 'admin' | 'user'): User => {
  const newUser: User = {
    id: `u-${Date.now()}`,
    name: email.split('@')[0], // Placeholder name
    email,
    role,
    status: 'pending',
    joinedDate: new Date().toISOString().split('T')[0]
  };
  USERS = [...USERS, newUser];
  return newUser;
};

export const removeUser = (id: string): void => {
  USERS = USERS.filter(u => u.id !== id);
};