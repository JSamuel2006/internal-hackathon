import { doctorRepository, DoctorEntity } from '../repositories/doctorRepository.js';
import { hospitalService } from './hospitalService.js';

export class DoctorService {
  async listDoctors(hospitalId?: string): Promise<DoctorEntity[]> {
    // Seed hospitals first if needed
    await hospitalService.listHospitals();

    let list = await doctorRepository.findAll();
    if (list.length === 0) {
      // Seed default doctors
      const d1 = await doctorRepository.create({
        id: 'doc-101',
        hospitalId: 'hosp-101',
        name: 'Dr. Patil',
        specialty: 'Cardiology',
        availability: 'Mon, Wed, Fri (09:00 - 13:00)'
      });
      const d2 = await doctorRepository.create({
        id: 'doc-102',
        hospitalId: 'hosp-102',
        name: 'Dr. Sharma',
        specialty: 'Oncology',
        availability: 'Tue, Thu (14:00 - 18:00)'
      });
      list = [d1, d2];
    }

    if (hospitalId) {
      return list.filter(d => d.hospitalId === hospitalId);
    }
    return list;
  }

  async getDoctorById(id: string): Promise<DoctorEntity | null> {
    return doctorRepository.findById(id);
  }

  async updateAvailability(id: string, availability: string): Promise<void> {
    await doctorRepository.updateAvailability(id, availability);
  }
}

export const doctorService = new DoctorService();
