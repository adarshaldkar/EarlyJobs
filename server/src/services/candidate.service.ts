import {
  Candidate,
  HiringStage,
  ICandidateDocument
} from '../models/Candidate.js';
import {
  CreateCandidateInput,
  UpdateCandidateInput,
  QueryCandidatesInput
} from '../schemas/candidate.schema.js';
import { ApiError } from '../utils/ApiError.js';

export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class CandidateService {
  /**
   * Create candidate with initial stage history
   */
  static async createCandidate(
    data: CreateCandidateInput
  ): Promise<ICandidateDocument> {
    const totalCount = await Candidate.countDocuments();
    if (totalCount >= 200) {
      throw new ApiError(
        422,
        'CAPACITY_EXCEEDED',
        'Demo database capacity reached (maximum 200 candidates allowed)'
      );
    }

    const initialStage = data.stage || 'Applied';

    try {
      const candidate = await Candidate.create({
        ...data,
        stage: initialStage,
        stageHistory: [
          {
            from: null,
            to: initialStage,
            changedAt: new Date(),
            notes: 'Candidate registered in ATS'
          }
        ]
      });

      return candidate;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ApiError(
          409,
          'DUPLICATE_EMAIL',
          'A candidate with this email address already exists.'
        );
      }
      throw err;
    }
  }

  /**
   * List candidates with search, filter, pagination, and sorting
   */
  static async listCandidates(query: QueryCandidatesInput) {
    const { page, limit, search, stage, sortBy, sortOrder } = query;
    const filter: Record<string, any> = {};

    // 1. Stage filter
    if (stage && stage !== 'All') {
      filter.stage = stage;
    }

    if (query.position && query.position !== 'All' && query.position.trim() !== '') {
      filter.position = query.position;
    }

    // 2. ReDoS-safe search
    if (search && search.trim() !== '') {
      const safeRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { name: safeRegex },
        { email: safeRegex },
        { position: safeRegex }
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Candidate.countDocuments(filter)
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get single candidate by ID with stage history
   */
  static async getCandidateById(id: string): Promise<ICandidateDocument> {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'Candidate not found.');
    }
    return candidate;
  }

  /**
   * Add recruiter note / interview feedback to candidate history
   */
  static async addNote(
    id: string,
    noteText: string,
    category?: string
  ): Promise<ICandidateDocument> {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'Candidate not found.');
    }

    const formattedNote = category && category !== 'General Note'
      ? `[${category}] ${noteText}`
      : noteText;

    candidate.stageHistory.push({
      from: candidate.stage,
      to: candidate.stage,
      changedAt: new Date(),
      notes: formattedNote
    });

    await candidate.save();
    return candidate;
  }

  /**
   * Update candidate profile fields (name, position, experience, skills, resumeUrl, notes, rating, tags).
   * Email and stage are strictly immutable via this endpoint.
   */
  static async updateCandidate(
    id: string,
    data: UpdateCandidateInput
  ): Promise<ICandidateDocument> {
    const safeData = { ...data };
    delete (safeData as any).email;
    delete (safeData as any).stage;
    delete (safeData as any).stageHistory;

    const updated = await Candidate.findByIdAndUpdate(
      id,
      { $set: safeData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'Candidate not found.');
    }

    return updated;
  }

  /**
   * Atomically update candidate stage with optimistic concurrency check
   */
  static async updateCandidateStage(
    id: string,
    currentStage: HiringStage,
    newStage: HiringStage,
    notes?: string
  ): Promise<ICandidateDocument> {
    // 1. Same-stage check: verify against persisted DB state
    if (currentStage === newStage) {
      const existing = await Candidate.findById(id);
      if (!existing) {
        throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'Candidate not found.');
      }

      // If database stage matches client currentStage -> genuine no-op
      if (existing.stage === currentStage) {
        return existing;
      }

      // Persisted candidate has already moved! Stale client!
      throw new ApiError(
        409,
        'STALE_STATE',
        `Candidate is currently in stage "${existing.stage}". Please refresh to view the latest state.`
      );
    }

    // 2. Atomic transition: matches id AND expected currentStage
    const updated = await Candidate.findOneAndUpdate(
      { _id: id, stage: currentStage },
      {
        $set: { stage: newStage },
        $push: {
          stageHistory: {
            from: currentStage,
            to: newStage,
            changedAt: new Date(),
            notes: notes || undefined
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      // Determine reason for failure
      const existing = await Candidate.findById(id);
      if (!existing) {
        throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'Candidate not found.');
      }

      // Concurrency conflict detected
      throw new ApiError(
        409,
        'STALE_STATE',
        `Candidate is currently in stage "${existing.stage}". Please refresh to view the latest state.`
      );
    }

    return updated;
  }

  /**
   * Delete candidate by ID
   */
  static async deleteCandidate(id: string): Promise<void> {
    const deleted = await Candidate.findByIdAndDelete(id);
    if (!deleted) {
      throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'Candidate not found.');
    }
  }
}
