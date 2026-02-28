import type { InvoiceItem } from "./invoiceItem.js";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "sent"
  | "paid"
  | "superseded";

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

const assertUuid = (value: string, field: string): void => {
  if (!value || value.trim().length < 36) {
    throw new Error(`${field} must be a valid UUID`);
  }
};

const assertDate = (value: string, field: string): void => {
  if (!ISO_DATE_REGEX.test(value)) {
    throw new Error(`${field} must follow YYYY-MM-DD format`);
  }
};

const assertNonNegativeInteger = (value: number, field: string): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
};

export class Invoice {
  public static create(props: InvoiceProps): Invoice {
    assertUuid(props.id, "Invoice id");
    assertUuid(props.personId, "Invoice personId");
    assertUuid(props.clientId, "Invoice clientId");
    assertDate(props.periodStart, "Invoice periodStart");
    assertDate(props.periodEnd, "Invoice periodEnd");
    assertNonNegativeInteger(props.number, "Invoice number");
    assertNonNegativeInteger(props.version, "Invoice version");
    assertNonNegativeInteger(props.subtotalCents, "Invoice subtotalCents");
    assertNonNegativeInteger(props.gstTotalCents, "Invoice gstTotalCents");
    assertNonNegativeInteger(props.totalCents, "Invoice totalCents");

    if (props.periodStart > props.periodEnd) {
      throw new Error("Invoice periodStart cannot be after periodEnd");
    }

    if (props.version < 1) {
      throw new Error("Invoice version must be greater than or equal to 1");
    }

    if (props.items.length === 0) {
      throw new Error("Invoice must have at least one item");
    }

    if (props.workLogIds.length === 0) {
      throw new Error("Invoice must reference at least one work log");
    }

    if (props.totalCents !== props.subtotalCents + props.gstTotalCents) {
      throw new Error("Invoice totalCents must match subtotalCents + gstTotalCents");
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
