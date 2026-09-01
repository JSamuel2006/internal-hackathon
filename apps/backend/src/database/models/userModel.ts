export type UserRole = 'ROLE_CITIZEN' | 'ROLE_DOCTOR' | 'ROLE_OFFICER' | 'ROLE_ADMIN' | 'ROLE_WORKER';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  jurisdiction?: string;
  village?: string;
  assignedAshaId?: string;
  abhaId?: string;
  professionalId?: string;
  age?: number;
  gender?: string;
  phone?: string;
  emergency_contact?: string;
  createdAt: Date;
  updatedAt: Date;
}
