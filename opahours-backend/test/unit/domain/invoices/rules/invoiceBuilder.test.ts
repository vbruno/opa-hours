import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { InvoiceDomainError } from "../../../../../src/domain/invoices/errors/invoiceDomainErrors.js";
import { WorkLog } from "../../../../../src/domain/work-logs/entities/workLog.js";
import { WorkLogItem } from "../../../../../src/domain/work-logs/entities/workLogItem.js";
import { buildInvoiceDraft } from "../../../../../src/domain/invoices/rules/invoiceBuilder.js";

const makeWorkLog = (
  input: {
    personId: string;
    clientId: string;
  } & Partial<{
    location: string;
    workDate: string;
    additionalCents: number;
    dailyAdditionalCents: number;
    startAt: string;
    endAt: string;
  }>,
) =>
  WorkLog.rehydrate({
    id: randomUUID(),
    personId: input.personId,
    clientId: input.clientId,
    workDate: input.workDate ?? "2026-02-28",
    dailyAdditionalCents: input.dailyAdditionalCents ?? 0,
    status: "draft",
    items: [
      WorkLogItem.create({
        id: randomUUID(),
        location: input.location ?? "Client HQ",
        startAt: input.startAt ?? "2026-02-28T09:00:00.000Z",
        endAt: input.endAt ?? "2026-02-28T11:00:00.000Z",
        breakMinutes: 0,
        hourlyRateCents: 10_000,
        additionalCents: input.additionalCents ?? 0,
      }),
    ],
  });

describe("invoiceBuilder", () => {
  const expectInvoiceErrorCode = (
    fn: () => unknown,
    code: InvoiceDomainError["code"],
  ) => {
    try {
      fn();
    } catch (error) {
      expect(error).toBeInstanceOf(InvoiceDomainError);
      expect((error as InvoiceDomainError).code).toBe(code);
      return;
    }

    throw new Error(`Expected InvoiceDomainError with code ${code}`);
  };

  it("builds invoice draft grouped by location", () => {
    const personId = randomUUID();
    const clientId = randomUUID();
    const first = makeWorkLog({
      personId,
      clientId,
      location: "Client HQ",
      dailyAdditionalCents: 500,
    });
    const second = makeWorkLog({
      personId,
      clientId,
      location: "Client HQ",
      workDate: "2026-03-01",
      startAt: "2026-03-01T09:00:00.000Z",
      endAt: "2026-03-01T11:00:00.000Z",
    });

    const draft = buildInvoiceDraft({
      invoiceNumber: 1,
      personId,
      clientId,
      gstPercentage: 10,
      workLogs: [first, second],
    });

    expect(draft.status).toBe("draft");
    expect(draft.periodStart).toBe("2026-02-28");
    expect(draft.periodEnd).toBe("2026-03-01");
    expect(draft.items).toHaveLength(2);
    expect(draft.subtotalCents).toBe(40_500);
    expect(draft.gstTotalCents).toBe(4_050);
    expect(draft.totalCents).toBe(44_550);
    expect(draft.workLogIds).toHaveLength(2);
  });

  it("rejects empty work-log selection", () => {
    expectInvoiceErrorCode(
      () =>
        buildInvoiceDraft({
          invoiceNumber: 1,
          personId: randomUUID(),
          clientId: randomUUID(),
          workLogs: [],
        }),
      "INVOICE_DRAFT_EMPTY_SELECTION",
    );
  });

  it("rejects duplicate work-log ids in selection", () => {
    const personId = randomUUID();
    const clientId = randomUUID();
    const workLog = makeWorkLog({ personId, clientId });

    expectInvoiceErrorCode(
      () =>
        buildInvoiceDraft({
          invoiceNumber: 1,
          personId,
          clientId,
          workLogs: [workLog, workLog],
        }),
      "INVOICE_DRAFT_DUPLICATE_WORK_LOG",
    );
  });

  it("rejects mixed clients or persons", () => {
    const personId = randomUUID();
    const clientId = randomUUID();
    const anotherClientId = randomUUID();
    const first = makeWorkLog({ personId, clientId });
    const second = makeWorkLog({ personId, clientId: anotherClientId });

    expectInvoiceErrorCode(
      () =>
        buildInvoiceDraft({
          invoiceNumber: 1,
          personId,
          clientId,
          workLogs: [first, second],
        }),
      "INVOICE_DRAFT_MIXED_CLIENTS",
    );
  });

  it("rejects non-draft work logs", () => {
    const personId = randomUUID();
    const clientId = randomUUID();
    const workLog = WorkLog.rehydrate({
      id: randomUUID(),
      personId,
      clientId,
      workDate: "2026-02-28",
      status: "linked",
      items: [
        WorkLogItem.create({
          id: randomUUID(),
          location: "Client HQ",
          startAt: "2026-02-28T09:00:00.000Z",
          endAt: "2026-02-28T10:00:00.000Z",
          breakMinutes: 0,
          hourlyRateCents: 10_000,
        }),
      ],
    });

    expectInvoiceErrorCode(
      () =>
        buildInvoiceDraft({
          invoiceNumber: 1,
          personId,
          clientId,
          workLogs: [workLog],
        }),
      "INVOICE_DRAFT_INELIGIBLE_STATUS",
    );
  });
});
