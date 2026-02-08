import type { WorkLog } from "../../../domain/work-logs/entities/workLog.js";

export interface WorkLogRepository {
  findById(id: string): Promise<WorkLog | null>;
  findByDate(personId: string, date: string): Promise<WorkLog | null>;
  save(workLog: WorkLog): Promise<void>;
  delete(id: string): Promise<void>;
}
