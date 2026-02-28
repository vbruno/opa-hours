export interface TransactionExecutor {
  select: (...args: never[]) => unknown;
  insert: (...args: never[]) => unknown;
  update: (...args: never[]) => unknown;
  delete: (...args: never[]) => unknown;
  transaction: (...args: never[]) => unknown;
}

export interface TransactionContext {
  tx: TransactionExecutor;
}
