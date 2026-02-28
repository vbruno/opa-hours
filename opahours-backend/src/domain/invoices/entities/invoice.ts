import type { InvoiceItem } from "./invoiceItem.js";
import { throwInvoiceDomainError } from "../errors/invoiceDomainErrors.js";

export type InvoiceStatus = "draft" | "issued" | "sent" | "paid" | "superseded";

export interface InvoiceProps {
  id: string;
  number: number;
  version: number;
  personId: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  subtotalCents: number;
  gstTotalCents: number;
  totalCents: number;
  previousInvoiceId?: string | null;
  issuedAt?: Date | null;
  paidAt?: Date | null;
  items: InvoiceItem[];
  workLogIds: string[];
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assertUuid = (
  value: string | null | undefined,
  code:
    | "INVOICE_INVALID_ID"
    | "INVOICE_INVALID_PERSON_ID"
    | "INVOICE_INVALID_CLIENT_ID"
    | "INVOICE_INVALID_PREVIOUS_INVOICE_ID",
): void => {
  if (!value || !UUID_REGEX.test(value)) {
    throwInvoiceDomainError(code);
  }
};

const assertDate = (
  value: string,
  code: "INVOICE_INVALID_PERIOD_START" | "INVOICE_INVALID_PERIOD_END",
): void => {
  if (!ISO_DATE_REGEX.test(value)) {
    throwInvoiceDomainError(code);
  }
};

const assertNonNegativeInteger = (
  value: number,
  code:
    | "INVOICE_INVALID_NUMBER"
    | "INVOICE_INVALID_VERSION"
    | "INVOICE_INVALID_SUBTOTAL"
    | "INVOICE_INVALID_GST_TOTAL"
    | "INVOICE_INVALID_TOTAL",
): void => {
  if (!Number.isInteger(value) || value < 0) {
    throwInvoiceDomainError(code);
  }
};

export class Invoice {
  public static create(props: InvoiceProps): Invoice {
    assertUuid(props.id, "INVOICE_INVALID_ID");
    assertUuid(props.personId, "INVOICE_INVALID_PERSON_ID");
    assertUuid(props.clientId, "INVOICE_INVALID_CLIENT_ID");
    if (props.previousInvoiceId) {
      assertUuid(
        props.previousInvoiceId,
        "INVOICE_INVALID_PREVIOUS_INVOICE_ID",
      );
    }
    assertDate(props.periodStart, "INVOICE_INVALID_PERIOD_START");
    assertDate(props.periodEnd, "INVOICE_INVALID_PERIOD_END");
    assertNonNegativeInteger(props.number, "INVOICE_INVALID_NUMBER");
    assertNonNegativeInteger(props.version, "INVOICE_INVALID_VERSION");
    assertNonNegativeInteger(props.subtotalCents, "INVOICE_INVALID_SUBTOTAL");
    assertNonNegativeInteger(props.gstTotalCents, "INVOICE_INVALID_GST_TOTAL");
    assertNonNegativeInteger(props.totalCents, "INVOICE_INVALID_TOTAL");

    if (props.periodStart > props.periodEnd) {
      throwInvoiceDomainError("INVOICE_INVALID_PERIOD_RANGE");
    }

    if (props.version < 1) {
      throwInvoiceDomainError("INVOICE_INVALID_VERSION");
    }

    if (props.number < 1) {
      throwInvoiceDomainError("INVOICE_INVALID_NUMBER");
    }

    if (props.items.length === 0) {
      throwInvoiceDomainError("INVOICE_EMPTY_ITEMS");
    }

    if (props.workLogIds.length === 0) {
      throwInvoiceDomainError("INVOICE_EMPTY_WORK_LOGS");
    }

    if (props.totalCents !== props.subtotalCents + props.gstTotalCents) {
      throwInvoiceDomainError("INVOICE_TOTAL_MISMATCH");
    }

    return new Invoice(props);
  }

  private constructor(private readonly props: InvoiceProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get number(): number {
    return this.props.number;
  }

  public get version(): number {
    return this.props.version;
  }

  public get personId(): string {
    return this.props.personId;
  }

  public get clientId(): string {
    return this.props.clientId;
  }

  public get periodStart(): string {
    return this.props.periodStart;
  }

  public get periodEnd(): string {
    return this.props.periodEnd;
  }

  public get status(): InvoiceStatus {
    return this.props.status;
  }

  public get subtotalCents(): number {
    return this.props.subtotalCents;
  }

  public get gstTotalCents(): number {
    return this.props.gstTotalCents;
  }

  public get totalCents(): number {
    return this.props.totalCents;
  }

  public get previousInvoiceId(): string | null {
    return this.props.previousInvoiceId ?? null;
  }

  public get issuedAt(): Date | null {
    return this.props.issuedAt ?? null;
  }

  public get paidAt(): Date | null {
    return this.props.paidAt ?? null;
  }

  public get items(): readonly InvoiceItem[] {
    return this.props.items;
  }

  public get workLogIds(): readonly string[] {
    return this.props.workLogIds;
  }
}
