import { hospitalRepository, HospitalEntity } from '../repositories/hospitalRepository.js';

export class HospitalService {
  async listHospitals(): Promise<HospitalEntity[]> {
    const list = await hospitalRepository.findAll();
    if (list.length === 0) {
      // Seed default hospitals for demo/grand finale
      const h1 = await hospitalRepository.create({
        id: 'hosp-101',
        name: 'AIMS Delhi',
        address: 'Ansari Nagar, New Delhi',
        bedOccupancy: 84,
        emergencyQueue: 12
      });
      const h2 = await hospitalRepository.create({
        id: 'hosp-102',
        name: 'Apollo Mumbai',
        address: 'CBD Belapur, Navi Mumbai',
        bedOccupancy: 76,
        emergencyQueue: 5
      });
      return [h1, h2];
    }
    return list;
  }

  async getHospitalById(id: string): Promise<HospitalEntity | null> {
    return hospitalRepository.findById(id);
  }
}

export const hospitalService = new HospitalService();
