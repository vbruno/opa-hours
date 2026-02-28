import { randomUUID } from "node:crypto";

import type { WorkLog } from "../../work-logs/entities/workLog.js";
import { Invoice } from "../entities/invoice.js";
import { InvoiceItem } from "../entities/invoiceItem.js";
import { calculateGst } from "./gst.js";

export interface BuildInvoiceDraftInput {
  invoiceId?: string;
  invoiceNumber: number;
  version?: number;
  personId: string;
  clientId: string;
  workLogs: WorkLog[];
  gstPercentage?: number;
}

const groupByLocation = (workLogs: WorkLog[]): InvoiceItem[] => {
  const amountByLocation = new Map<string, number>();

  for (const workLog of workLogs) {
    for (const item of workLog.items) {
      const current = amountByLocation.get(item.location) ?? 0;
      amountByLocation.set(item.location, current + item.totalCents);
    }

    if (workLog.dailyAdditionalCents !== 0) {
      const current = amountByLocation.get("Daily additional") ?? 0;
      amountByLocation.set(
        "Daily additional",
        current + workLog.dailyAdditionalCents,
      );
    }
  }

  return [...amountByLocation.entries()].map(([location, amountCents], index) =>
    InvoiceItem.create({
      id: randomUUID(),
      description:
        location === "Daily additional"
          ? "Daily additional adjustments"
          : `Work performed at ${location}`,
      location: location === "Daily additional" ? null : location,
      amountCents,
      sortOrder: index,
    }),
  );
};

export const buildInvoiceDraft = (
  input: BuildInvoiceDraftInput,
): Invoice => {
  if (input.workLogs.length === 0) {
    throw new Error("Invoice draft requires at least one work log");
  }

  const periodStart = [...input.workLogs]
    .map((workLog) => workLog.workDate)
    .sort()[0];
  const periodEnd = [...input.workLogs]
    .map((workLog) => workLog.workDate)
    .sort()
    .at(-1)!;

  const items = groupByLocation(input.workLogs);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );
  const gstTotalCents = calculateGst(subtotalCents, input.gstPercentage ?? 0);

  return Invoice.create({
    id: input.invoiceId ?? randomUUID(),
    number: input.invoiceNumber,
    version: input.version ?? 1,
    personId: input.personId,
    clientId: input.clientId,
    periodStart,
    periodEnd,
    status: "draft",
    subtotalCents,
    gstTotalCents,
    totalCents: subtotalCents + gstTotalCents,
    items,
    workLogIds: input.workLogs.map((workLog) => workLog.id),
  });
};
