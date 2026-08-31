/**
 * Authorized Prototype Registry for Healthcare Identity Verification
 * (Used to verify Doctor, ASHA Worker, and Officer IDs before granting role privileges)
 */

export interface RegistryRecord {
  id: string;
  name: string;
  title: string;
  jurisdiction?: string;
  status: 'VERIFIED';
}

export const AUTHORIZED_DOCTORS: Record<string, RegistryRecord> = {
  'DOC-1001': { id: 'DOC-1001', name: 'Dr. Rajesh Sharma', title: 'Senior Cardiologist', status: 'VERIFIED' },
  'DOC-1002': { id: 'DOC-1002', name: 'Dr. Ananya Roy', title: 'General Physician', status: 'VERIFIED' },
  'DOC-1003': { id: 'DOC-1003', name: 'Dr. Vikram Patel', title: 'Pediatric Specialist', status: 'VERIFIED' },
  'DOC-1004': { id: 'DOC-1004', name: 'Dr. Meera Nambiar', title: 'Gynecological Specialist', status: 'VERIFIED' },
};

export const AUTHORIZED_ASHA_WORKERS: Record<string, RegistryRecord> = {
  'ASHA-2001': { id: 'ASHA-2001', name: 'Sunita Devi', title: 'ASHA Community Health Worker', jurisdiction: 'Haveli Village', status: 'VERIFIED' },
  'ASHA-2002': { id: 'ASHA-2002', name: 'Priya Sharma', title: 'ASHA Community Health Worker', jurisdiction: 'Khed Village', status: 'VERIFIED' },
  'ASHA-2003': { id: 'ASHA-2003', name: 'Lakshmi Gaikwad', title: 'ASHA Community Health Worker', jurisdiction: 'Shirur Village', status: 'VERIFIED' },
  'ASHA-2004': { id: 'ASHA-2004', name: 'Saraswati Pawar', title: 'ASHA Community Health Worker', jurisdiction: 'Junnar Village', status: 'VERIFIED' },
};

export const AUTHORIZED_OFFICERS: Record<string, RegistryRecord> = {
  'OFF-3001': { id: 'OFF-3001', name: 'Pune Health Officer', title: 'District Public Health Officer', jurisdiction: 'Pune District', status: 'VERIFIED' },
  'OFF-3002': { id: 'OFF-3002', name: 'Nagpur Surveillance Officer', title: 'Epidemiological Officer', jurisdiction: 'Nagpur District', status: 'VERIFIED' },
  'OFF-3003': { id: 'OFF-3003', name: 'Mumbai Medical Officer', title: 'Metropolitan Health Officer', jurisdiction: 'Mumbai Metropolitan', status: 'VERIFIED' },
  'OFF-3004': { id: 'OFF-3004', name: 'Nashik Health Director', title: 'Regional Health Director', jurisdiction: 'Nashik Division', status: 'VERIFIED' },
};

export function verifyProfessionalIdentity(accountType: string, id: string) {
  const cleanId = (id || '').trim().toUpperCase();
  const typeUpper = (accountType || '').trim().toUpperCase();

  if (typeUpper === 'DOCTOR') {
    const record = AUTHORIZED_DOCTORS[cleanId];
    if (!record) {
      return { verified: false, error: 'Doctor identity could not be verified in the Authorized Prototype Registry.' };
    }
    return { verified: true, record, role: 'ROLE_DOCTOR' as const };
  }

  if (typeUpper === 'ASHA' || typeUpper === 'WORKER') {
    const record = AUTHORIZED_ASHA_WORKERS[cleanId];
    if (!record) {
      return { verified: false, error: 'ASHA Worker identity could not be verified in the Authorized Prototype Registry.' };
    }
    return { verified: true, record, role: 'ROLE_WORKER' as const };
  }

  if (typeUpper === 'OFFICER') {
    const record = AUTHORIZED_OFFICERS[cleanId];
    if (!record) {
      return { verified: false, error: 'Public Health Officer identity could not be verified in the Authorized Prototype Registry.' };
    }
    return { verified: true, record, role: 'ROLE_OFFICER' as const };
  }

  return { verified: false, error: 'Invalid professional account type.' };
}
