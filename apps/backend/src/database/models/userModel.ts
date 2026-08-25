export type UserRole = 'ROLE_CITIZEN' | 'ROLE_DOCTOR' | 'ROLE_OFFICER' | 'ROLE_ADMIN' | 'ROLE_WORKER';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  jurisdiction?: string;
  abhaId?: string;
  createdAt: Date;
  updatedAt: Date;
}
