export interface InvoiceItemProps {
  id: string;
  description: string;
  location?: string | null;
  amountCents: number;
  sortOrder?: number;
}

const assertUuid = (value: string, field: string): void => {
  if (!value || value.trim().length < 36) {
    throw new Error(`${field} must be a valid UUID`);
  }
};

export class InvoiceItem {
  public static create(props: InvoiceItemProps): InvoiceItem {
    assertUuid(props.id, "InvoiceItem id");

    if (props.description.trim().length < 2) {
      throw new Error("InvoiceItem description must contain at least 2 characters");
    }

    if (!Number.isInteger(props.amountCents) || props.amountCents < 0) {
      throw new Error("InvoiceItem amountCents must be a non-negative integer");
    }

    if (
      props.sortOrder !== undefined &&
      (!Number.isInteger(props.sortOrder) || props.sortOrder < 0)
    ) {
      throw new Error("InvoiceItem sortOrder must be a non-negative integer");
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
