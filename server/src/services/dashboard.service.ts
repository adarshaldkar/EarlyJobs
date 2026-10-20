import { Candidate, HIRING_STAGES, HiringStage } from '../models/Candidate.js';

export interface DashboardSummary {
  total: number;
  activePipeline: number;
  interviewing: number;
  hired: number;
  rejected: number;
  stageCounts: Record<HiringStage, number>;
  recentCandidates: any[];
}

export class DashboardService {
  /**
   * High-performance single-query facet aggregation with guaranteed zero-filling
   */
  static async getSummary(): Promise<DashboardSummary> {
    const [stats] = await Candidate.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          stageCounts: [{ $group: { _id: '$stage', count: { $sum: 1 } } }],
          recent: [{ $sort: { createdAt: -1 } }, { $limit: 5 }]
        }
      }
    ]);

    // In-memory zero-fill for all 6 stages
    const stageCounts: Record<HiringStage, number> = {
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Hired: 0,
      Rejected: 0
    };

    if (stats?.stageCounts && Array.isArray(stats.stageCounts)) {
      stats.stageCounts.forEach(
        (entry: { _id: HiringStage; count: number }) => {
          if (entry._id && entry._id in stageCounts) {
            stageCounts[entry._id] = entry.count;
          }
        }
      );
    }

    const total = stats?.total?.[0]?.count || 0;
    const activePipeline =
      stageCounts.Applied +
      stageCounts.Screening +
      stageCounts.Interview +
      stageCounts.Offer;
    const interviewing = stageCounts.Interview;
    const hired = stageCounts.Hired;
    const rejected = stageCounts.Rejected;
    const recentCandidates = stats?.recent || [];

    return {
      total,
      activePipeline,
      interviewing,
      hired,
      rejected,
      stageCounts,
      recentCandidates
    };
  }
}
