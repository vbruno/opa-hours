import type { TransactionContext } from "../../application/shared/ports/transactionContext.js";
import type { UnitOfWork } from "../../application/work-logs/ports/unitOfWork.js";
import { db } from "./connection.js";

export class DrizzleUnitOfWork implements UnitOfWork {
  public async transaction<T>(
    handler: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => handler({ tx }));
  }
}
