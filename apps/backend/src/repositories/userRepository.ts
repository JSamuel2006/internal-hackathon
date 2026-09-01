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
    [
      'worker-demo',
      {
        id: 'worker-demo',
        name: 'Sunita Devi (ASHA)',
        email: 'asha.haveli@arogyamitra.gov.in',
        role: 'ROLE_WORKER',
        jurisdiction: 'Haveli Village',
        abhaId: 'ABHA-91-8842-1029-4412',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'worker-demo-2',
      {
        id: 'worker-demo-2',
        name: 'Priya Sharma (ASHA)',
        email: 'priya.khed@arogyamitra.gov.in',
        role: 'ROLE_WORKER',
        jurisdiction: 'Khed Village',
        abhaId: 'ABHA-91-8842-1029-4413',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'worker-demo-3',
      {
        id: 'worker-demo-3',
        name: 'Lakshmi Gaikwad (ASHA)',
        email: 'lakshmi.shirur@arogyamitra.gov.in',
        role: 'ROLE_WORKER',
        jurisdiction: 'Shirur Village',
        abhaId: 'ABHA-91-8842-1029-4414',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'usr-citizen-demo',
      {
        id: 'usr-citizen-demo',
        name: 'Rahul Verma',
        email: 'citizen.rahul@gmail.com',
        role: 'ROLE_CITIZEN',
        abhaId: 'ABHA-91-8842-1029-4410',
        age: 34,
        gender: 'Male',
        village: 'Haveli Village',
        jurisdiction: 'Haveli Village',
        assignedAshaId: 'worker-demo',
        phone: '+91 98234 11200',
        emergency_contact: '+91 98234 11201',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'usr-citizen-2',
      {
        id: 'usr-citizen-2',
        name: 'Anita Deshmukh',
        email: 'anita.deshmukh@gmail.com',
        role: 'ROLE_CITIZEN',
        abhaId: 'ABHA-91-4412-9901-2211',
        age: 28,
        gender: 'Female',
        village: 'Haveli Village',
        jurisdiction: 'Haveli Village',
        assignedAshaId: 'worker-demo',
        phone: '+91 98765 43210',
        emergency_contact: '+91 98765 43211',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'usr-citizen-3',
      {
        id: 'usr-citizen-3',
        name: 'Ramesh Patil',
        email: 'ramesh.patil@gmail.com',
        role: 'ROLE_CITIZEN',
        abhaId: 'ABHA-91-3312-8822-7711',
        age: 52,
        gender: 'Male',
        village: 'Haveli Village',
        jurisdiction: 'Haveli Village',
        assignedAshaId: 'worker-demo',
        phone: '+91 91234 56789',
        emergency_contact: '+91 91234 56790',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'usr-citizen-4',
      {
        id: 'usr-citizen-4',
        name: 'Suresh Shinde',
        email: 'suresh.shinde@khed.gov.in',
        role: 'ROLE_CITIZEN',
        abhaId: 'ABHA-91-7788-9900-1122',
        age: 45,
        gender: 'Male',
        village: 'Khed Village',
        jurisdiction: 'Khed Village',
        assignedAshaId: 'worker-demo-2',
        phone: '+91 99887 76655',
        emergency_contact: '+91 99887 76656',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  public async findByProfessionalId(professionalId: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.professionalId && user.professionalId.toUpperCase() === professionalId.toUpperCase().trim()) return user;
    }
    return null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return null;
  }

  public async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  public async findAllCitizens(): Promise<UserEntity[]> {
    const list: UserEntity[] = [];
    for (const user of this.users.values()) {
      if (user.role === 'ROLE_CITIZEN') {
        list.push(user);
      }
    }
    return list;
  }

  public async findCitizensByJurisdictionOrWorker(workerId: string, workerJurisdiction: string, query: string = ''): Promise<UserEntity[]> {
    const list: UserEntity[] = [];
    const q = (query || '').toLowerCase().trim();
    const wJur = (workerJurisdiction || '').toLowerCase().replace('village', '').trim();

    for (const user of this.users.values()) {
      if (user.role === 'ROLE_CITIZEN') {
        const uVil = (user.village || user.jurisdiction || '').toLowerCase().replace('village', '').trim();
        const isAssigned = user.assignedAshaId === workerId;
        const isSameVillage = wJur && uVil && (wJur.includes(uVil) || uVil.includes(wJur));

        if (isAssigned || isSameVillage) {
          if (!q || user.name.toLowerCase().includes(q) || (user.abhaId && user.abhaId.toLowerCase().includes(q))) {
            list.push(user);
          }
        }
      }
    }
    return list;
  }

  public async isWorkerAuthorizedForCitizen(workerId: string, workerJurisdiction: string, citizenId: string): Promise<boolean> {
    const citizen = await this.findById(citizenId);
    if (!citizen || citizen.role !== 'ROLE_CITIZEN') return false;
    if (citizen.assignedAshaId === workerId) return true;
    const wJur = (workerJurisdiction || '').toLowerCase().replace('village', '').trim();
    const cVil = (citizen.village || citizen.jurisdiction || '').toLowerCase().replace('village', '').trim();
    return Boolean(wJur && cVil && (wJur.includes(cVil) || cVil.includes(wJur)));
  }

  public async findAllWorkers(): Promise<UserEntity[]> {
    const list: UserEntity[] = [];
    for (const user of this.users.values()) {
      if (user.role === 'ROLE_WORKER') {
        list.push(user);
      }
    }
    return list;
  }

  public async findCitizenByNameOrAbha(query: string): Promise<UserEntity[]> {
    const list: UserEntity[] = [];
    const q = query.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.role === 'ROLE_CITIZEN') {
        if (
          user.name.toLowerCase().includes(q) ||
          (user.abhaId && user.abhaId.toLowerCase().includes(q))
        ) {
          list.push(user);
        }
      }
    }
    return list;
  }

  public async createUser(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const deterministicId = 'usr-' + crypto
      .createHash('sha256')
      .update(data.email.toLowerCase().trim())
      .digest('hex')
      .substring(0, 20);

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
