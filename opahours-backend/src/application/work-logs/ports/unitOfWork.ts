import type { TransactionContext } from "../../shared/ports/transactionContext.js";

export interface UnitOfWork {
  transaction<T>(handler: (context: TransactionContext) => Promise<T>): Promise<T>;
}
