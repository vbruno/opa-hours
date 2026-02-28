import type { Invoice } from "../../../domain/invoices/entities/invoice.js";
import type { TransactionContext } from "../../shared/ports/transactionContext.js";

export interface InvoiceRepository {
  findById(id: string, context?: TransactionContext): Promise<Invoice | null>;
  findNextNumber(context?: TransactionContext): Promise<number>;
  findByWorkLogId(
    workLogId: string,
    context?: TransactionContext,
  ): Promise<Invoice | null>;
  save(invoice: Invoice, context?: TransactionContext): Promise<void>;
}
