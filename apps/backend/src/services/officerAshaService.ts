import { screeningRepository } from '../repositories/screeningRepository.js';
import { userRepository } from '../repositories/userRepository.js';

export interface OfficerAshaOverview {
  totalWorkers: number;
  totalScreenings: number;
  todayScreenings: number;
  thisWeekScreenings: number;
  referrals: {
    urgent: number;
    priority: number;
    needsReview: number;
    normal: number;
  };
  syncStats: {
    syncedRecords: number;
    unresolvedPriorityCases: number;
    syncEngineStatus: string;
  };
}

export interface OfficerWorkerItem {
  workerId: string;
  name: string;
  email: string;
  village: string;
  jurisdiction: string;
  totalScreenings: number;
  todayScreenings: number;
  lastActivityDate: string | null;
  status: 'Active' | 'Idle';
}

export class OfficerAshaService {
  public async getOverview(): Promise<OfficerAshaOverview> {
    const workers = await userRepository.findAllWorkers();
    const metrics = await screeningRepository.getOverviewMetrics();

    return {
      totalWorkers: workers.length,
      totalScreenings: metrics.totalScreenings,
      todayScreenings: metrics.todayScreenings,
      thisWeekScreenings: metrics.thisWeekScreenings,
      referrals: metrics.referrals,
      syncStats: {
        syncedRecords: metrics.syncStats.syncedRecords,
        unresolvedPriorityCases: metrics.syncStats.unresolvedPriorityCases,
        syncEngineStatus: 'ONLINE_ACTIVE',
      },
    };
  }

  public async getWorkers(): Promise<OfficerWorkerItem[]> {
    const allWorkers = await userRepository.findAllWorkers();
    const aggregations = await screeningRepository.getWorkerAggregations();

    const aggMap = new Map(aggregations.map(a => [a.worker_user_id, a]));

    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    return allWorkers.map(w => {
      const agg = aggMap.get(w.id);
      const totalScreenings = agg ? agg.total_screenings : 0;
      const todayScreenings = agg ? agg.today_screenings : 0;
      const lastActivityDate = agg && agg.last_activity_date ? agg.last_activity_date.toISOString() : null;

      // Status derived from activity in last 3 days
      let status: 'Active' | 'Idle' = 'Idle';
      if (agg && agg.last_activity_date) {
        if (now - agg.last_activity_date.getTime() < THREE_DAYS_MS) {
          status = 'Active';
        }
      }

      return {
        workerId: w.id,
        name: w.name,
        email: w.email,
        village: w.jurisdiction || 'Haveli Village',
        jurisdiction: w.jurisdiction || 'Haveli Village',
        totalScreenings,
        todayScreenings,
        lastActivityDate,
        status,
      };
    });
  }

  public async getScreenings(filters: {
    workerId?: string;
    riskLevel?: string;
    dateRange?: 'today' | 'week' | 'month' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const workers = await userRepository.findAllWorkers();
    const workerMap = new Map(workers.map(w => [w.id, w.name]));

    const { records, total } = await screeningRepository.findScreeningsFiltered(filters);

    const mapped = records.map(r => {
      let riskFlags: string[] = [];
      try {
        riskFlags = JSON.parse(r.risk_flags || '[]');
      } catch {
        riskFlags = [];
      }

      return {
        id: r.id,
        clientRecordId: r.client_record_id,
        workerId: r.worker_user_id,
        workerName: workerMap.get(r.worker_user_id) || r.worker_user_id,
        citizenName: r.citizen_name,
        citizenUserId: r.citizen_user_id,
        village: r.village,
        screeningDate: r.screening_date,
        riskLevel: r.risk_level || 'NORMAL',
        riskFlags,
        syncStatus: 'SYNCED',
        createdAt: r.created_at,
      };
    });

    return {
      screenings: mapped,
      total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };
  }
}

export const officerAshaService = new OfficerAshaService();
