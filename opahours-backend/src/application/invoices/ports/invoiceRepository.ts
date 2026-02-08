import type { Invoice } from "../../../domain/invoices/entities/invoice.js";

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  save(invoice: Invoice): Promise<void>;
}
