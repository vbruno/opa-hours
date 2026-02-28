export const invoiceDomainErrorMessages = {
  INVOICE_INVALID_ID: "Invoice id must be a valid UUID",
  INVOICE_INVALID_PERSON_ID: "Invoice personId must be a valid UUID",
  INVOICE_INVALID_CLIENT_ID: "Invoice clientId must be a valid UUID",
  INVOICE_INVALID_PREVIOUS_INVOICE_ID:
    "Invoice previousInvoiceId must be a valid UUID",
  INVOICE_INVALID_PERIOD_START:
    "Invoice periodStart must follow YYYY-MM-DD format",
  INVOICE_INVALID_PERIOD_END: "Invoice periodEnd must follow YYYY-MM-DD format",
  INVOICE_INVALID_PERIOD_RANGE: "Invoice periodStart cannot be after periodEnd",
  INVOICE_INVALID_NUMBER: "Invoice number must be a positive integer",
  INVOICE_INVALID_VERSION: "Invoice version must be a positive integer",
  INVOICE_INVALID_SUBTOTAL:
    "Invoice subtotalCents must be a non-negative integer",
  INVOICE_INVALID_GST_TOTAL:
    "Invoice gstTotalCents must be a non-negative integer",
  INVOICE_INVALID_TOTAL: "Invoice totalCents must be a non-negative integer",
  INVOICE_TOTAL_MISMATCH:
    "Invoice totalCents must match subtotalCents + gstTotalCents",
  INVOICE_EMPTY_ITEMS: "Invoice must have at least one item",
  INVOICE_EMPTY_WORK_LOGS: "Invoice must reference at least one work log",
  INVOICE_INVALID_ITEM_ID: "Invoice item id must be a valid UUID",
  INVOICE_INVALID_ITEM_DESCRIPTION:
    "Invoice item description must contain at least 2 characters",
  INVOICE_INVALID_ITEM_AMOUNT:
    "Invoice item amountCents must be a non-negative integer",
  INVOICE_INVALID_ITEM_SORT_ORDER:
    "Invoice item sortOrder must be a non-negative integer",
  INVOICE_DRAFT_EMPTY_SELECTION: "Invoice draft requires at least one work log",
  INVOICE_DRAFT_DUPLICATE_WORK_LOG:
    "Invoice draft cannot contain duplicate work logs",
  INVOICE_DRAFT_MIXED_CLIENTS:
    "Invoice draft must contain work logs from a single client",
  INVOICE_DRAFT_MIXED_PERSONS:
    "Invoice draft must contain work logs from a single person",
  INVOICE_DRAFT_INELIGIBLE_STATUS:
    "Invoice draft can only be created from draft work logs",
} as const;

export type InvoiceDomainErrorCode = keyof typeof invoiceDomainErrorMessages;

const invoiceDomainErrorStatusByCode: Record<InvoiceDomainErrorCode, number> = {
  INVOICE_INVALID_ID: 400,
  INVOICE_INVALID_PERSON_ID: 400,
  INVOICE_INVALID_CLIENT_ID: 400,
  INVOICE_INVALID_PREVIOUS_INVOICE_ID: 400,
  INVOICE_INVALID_PERIOD_START: 400,
  INVOICE_INVALID_PERIOD_END: 400,
  INVOICE_INVALID_PERIOD_RANGE: 400,
  INVOICE_INVALID_NUMBER: 400,
  INVOICE_INVALID_VERSION: 400,
  INVOICE_INVALID_SUBTOTAL: 400,
  INVOICE_INVALID_GST_TOTAL: 400,
  INVOICE_INVALID_TOTAL: 400,
  INVOICE_TOTAL_MISMATCH: 400,
  INVOICE_EMPTY_ITEMS: 400,
  INVOICE_EMPTY_WORK_LOGS: 400,
  INVOICE_INVALID_ITEM_ID: 400,
  INVOICE_INVALID_ITEM_DESCRIPTION: 400,
  INVOICE_INVALID_ITEM_AMOUNT: 400,
  INVOICE_INVALID_ITEM_SORT_ORDER: 400,
  INVOICE_DRAFT_EMPTY_SELECTION: 400,
  INVOICE_DRAFT_DUPLICATE_WORK_LOG: 409,
  INVOICE_DRAFT_MIXED_CLIENTS: 409,
  INVOICE_DRAFT_MIXED_PERSONS: 409,
  INVOICE_DRAFT_INELIGIBLE_STATUS: 409,
};

export class InvoiceDomainError extends Error {
  public readonly code: InvoiceDomainErrorCode;
  public readonly details: Record<string, unknown> | null;

  public constructor(
    code: InvoiceDomainErrorCode,
    details: Record<string, unknown> | null = null,
  ) {
    super(`${code}: ${invoiceDomainErrorMessages[code]}`);
    this.name = "InvoiceDomainError";
    this.code = code;
    this.details = details;
  }
}

export const getInvoiceDomainErrorStatusCode = (
  code: InvoiceDomainErrorCode,
): number => invoiceDomainErrorStatusByCode[code];

export const throwInvoiceDomainError = (
  code: InvoiceDomainErrorCode,
  details: Record<string, unknown> | null = null,
): never => {
  throw new InvoiceDomainError(code, details);
};
