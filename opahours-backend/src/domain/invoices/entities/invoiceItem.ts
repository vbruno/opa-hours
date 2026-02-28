import { throwInvoiceDomainError } from "../errors/invoiceDomainErrors.js";

export interface InvoiceItemProps {
  id: string;
  description: string;
  location?: string | null;
  amountCents: number;
  sortOrder?: number;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class InvoiceItem {
  public static create(props: InvoiceItemProps): InvoiceItem {
    if (!UUID_REGEX.test(props.id)) {
      throwInvoiceDomainError("INVOICE_INVALID_ITEM_ID");
    }

    if (props.description.trim().length < 2) {
      throwInvoiceDomainError("INVOICE_INVALID_ITEM_DESCRIPTION");
    }

    if (!Number.isInteger(props.amountCents) || props.amountCents < 0) {
      throwInvoiceDomainError("INVOICE_INVALID_ITEM_AMOUNT");
    }

    if (
      props.sortOrder !== undefined &&
      (!Number.isInteger(props.sortOrder) || props.sortOrder < 0)
    ) {
      throwInvoiceDomainError("INVOICE_INVALID_ITEM_SORT_ORDER");
    }

    return new InvoiceItem(props);
  }

  private constructor(private readonly props: InvoiceItemProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get description(): string {
    return this.props.description;
  }

  public get location(): string | null {
    return this.props.location ?? null;
  }

  public get amountCents(): number {
    return this.props.amountCents;
  }

  public get sortOrder(): number {
    return this.props.sortOrder ?? 0;
  }
}
