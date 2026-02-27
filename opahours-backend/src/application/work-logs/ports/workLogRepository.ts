import type { WorkLog } from "../../../domain/work-logs/entities/workLog.js";
import type { WorkLogStatus } from "../../../domain/work-logs/entities/workLog.js";

export interface WorkLogListFilters {
  personId: string;
  from?: string;
  to?: string;
  clientId?: string;
  status?: WorkLogStatus;
}

export interface WorkLogRepository {
  findById(id: string): Promise<WorkLog | null>;
  findByPersonClientAndDate(
    personId: string,
    clientId: string,
    date: string,
  ): Promise<WorkLog | null>;
  list(filters: WorkLogListFilters): Promise<WorkLog[]>;
  save(workLog: WorkLog): Promise<void>;
  delete(id: string): Promise<void>;
}
