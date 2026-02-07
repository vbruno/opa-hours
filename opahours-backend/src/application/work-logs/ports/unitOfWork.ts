export interface UnitOfWork {
  transaction<T>(handler: () => Promise<T>): Promise<T>;
}
