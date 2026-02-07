import { AppError } from "@/application/shared/errors/appError";

export interface WorkLogItemProps {
  address: string;
  durationMin: number;
  additionalItem?: number;
  notes?: string;
}

export class WorkLogItem {
  public readonly address: string;
  public readonly durationMin: number;
  public readonly additionalItem: number;
  public readonly notes?: string;

  public constructor(props: WorkLogItemProps) {
    if (!props.address.trim()) {
      throw new AppError("INVALID_ITEM_ADDRESS", "Work log item address is required", 422);
    }

    if (!Number.isInteger(props.durationMin) || props.durationMin <= 0) {
      throw new AppError("INVALID_ITEM_DURATION", "Work log item duration must be a positive integer", 422);
    }

    this.address = props.address.trim();
    this.durationMin = props.durationMin;
    this.additionalItem = Number((props.additionalItem ?? 0).toFixed(2));
    this.notes = props.notes?.trim() || undefined;
  }
}
