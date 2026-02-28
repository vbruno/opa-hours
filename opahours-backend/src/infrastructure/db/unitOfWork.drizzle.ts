import type { UnitOfWork } from "../../application/work-logs/ports/unitOfWork.js";
import { db } from "./connection.js";

export class DrizzleUnitOfWork implements UnitOfWork {
  public async transaction<T>(handler: () => Promise<T>): Promise<T> {
    return db.transaction(async () => handler());
  }
}
