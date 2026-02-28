import type { WorkLog } from "../../../domain/work-logs/entities/workLog.js";
import type { WorkLogStatus } from "../../../domain/work-logs/entities/workLog.js";
import type { TransactionContext } from "../../shared/ports/transactionContext.js";

export interface WorkLogListFilters {
  personId: string;
  from?: string;
  to?: string;
  clientId?: string;
  status?: WorkLogStatus;
}

export interface WorkLogRepository {
  findById(id: string, context?: TransactionContext): Promise<WorkLog | null>;
  findManyByIds(ids: string[], context?: TransactionContext): Promise<WorkLog[]>;
  findByPersonClientAndDate(
    personId: string,
    clientId: string,
    date: string,
    context?: TransactionContext,
  ): Promise<WorkLog | null>;
  list(filters: WorkLogListFilters, context?: TransactionContext): Promise<WorkLog[]>;
  save(workLog: WorkLog, context?: TransactionContext): Promise<void>;
  delete(id: string, context?: TransactionContext): Promise<void>;
}
