import crypto from 'crypto';
import { UserEntity, UserRole } from '../database/models/userModel.js';

export class UserRepository {
  private users: Map<string, UserEntity> = new Map([
    [
      'usr-901',
      {
        id: 'usr-901',
        name: 'Pune Health Officer',
        email: 'officer.pune@mohfw.gov.in',
        role: 'ROLE_OFFICER',
        jurisdiction: 'Pune District',
        abhaId: 'ABHA-91-8842-1029-4410',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'doc-demo',
      {
        id: 'doc-demo',
        name: 'Dr. Rajesh Sharma',
        email: 'doctor@arogyamitra.demo',
        role: 'ROLE_DOCTOR',
        abhaId: 'ABHA-91-8842-1029-4411',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  public async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  public async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  public async createUser(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    // Deterministic ID from email — stable across server restarts so session ownership
    // checks (session.user_id === req.user.id) remain valid after re-logins.
    const deterministicId = `usr-${crypto
      .createHash('sha256')
      .update(data.email.toLowerCase().trim())
      .digest('hex')
      .substring(0, 20)}`;

    const newUser: UserEntity = {
      id: deterministicId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }
}

export const userRepository = new UserRepository();
