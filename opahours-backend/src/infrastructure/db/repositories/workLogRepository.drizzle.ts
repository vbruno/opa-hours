import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import type {
  WorkLogListFilters,
  WorkLogRepository,
} from "../../../application/work-logs/ports/workLogRepository.js";
import type {
  TransactionContext,
  TransactionExecutor,
} from "../../../application/shared/ports/transactionContext.js";
import { WorkLog } from "../../../domain/work-logs/entities/workLog.js";
import { WorkLogItem } from "../../../domain/work-logs/entities/workLogItem.js";
import { db } from "../connection.js";
import {
  lancamentosHora,
  type LancamentoHoraRow,
  type NewLancamentoHoraRow,
} from "../schema/lancamentosHora.js";
import {
  lancamentosItens,
  type LancamentoItemRow,
  type NewLancamentoItemRow,
} from "../schema/lancamentosItens.js";

type DatabaseExecutor = TransactionExecutor;

const resolveExecutor = (context?: TransactionContext): DatabaseExecutor =>
  context?.tx ?? (db as unknown as DatabaseExecutor);

const mapItemRowToDomain = (row: LancamentoItemRow): WorkLogItem =>
  WorkLogItem.create({
    id: row.id,
    location: row.endereco,
    startAt: row.startAt,
    endAt: row.endAt,
    breakMinutes: row.breakMin,
    hourlyRateCents: row.valorHoraCents,
    additionalCents: row.adicionalItemCents,
    notes: row.observacoes,
  });

const mapHeaderRowToDomain = (
  row: LancamentoHoraRow,
  itemRows: LancamentoItemRow[],
): WorkLog =>
  WorkLog.rehydrate({
    id: row.id,
    personId: row.pessoaId,
    clientId: row.clienteId,
    workDate: row.data,
    notes: row.observacoes,
    dailyAdditionalCents: row.adicionalDiaCents,
    status: row.statusFaturamento,
    items: itemRows.map((itemRow) => mapItemRowToDomain(itemRow)),
  });

const toHeaderInsert = (workLog: WorkLog): NewLancamentoHoraRow => ({
  id: workLog.id,
  pessoaId: workLog.personId,
  clienteId: workLog.clientId,
  data: workLog.workDate,
  horaInicio: workLog.startAt,
  horaFim: workLog.endAt,
  breakMin: workLog.totalBreakMinutes,
  duracaoMin: workLog.totalPayableMinutes,
  adicionalDiaCents: workLog.dailyAdditionalCents,
  valorTotalCents: workLog.totalCents,
  observacoes: workLog.notes,
  statusFaturamento: workLog.status,
  updatedAt: new Date(),
});

const toItemInsert = (
  workLogId: string,
  item: WorkLogItem,
): NewLancamentoItemRow => ({
  id: item.id,
  lancamentoId: workLogId,
  endereco: item.location,
  startAt: item.period.startAt,
  endAt: item.period.endAt,
  breakMin: item.breakDuration.minutes,
  duracaoMin: item.payableDuration.minutes,
  valorHoraCents: item.hourlyRate.cents,
  adicionalItemCents: item.additionalCents,
  observacoes: item.notes,
  updatedAt: new Date(),
});

export class DrizzleWorkLogRepository implements WorkLogRepository {
  public async findById(
    id: string,
    context?: TransactionContext,
  ): Promise<WorkLog | null> {
    const executor = resolveExecutor(context);
    const rows = await executor
      .select()
      .from(lancamentosHora)
      .where(eq(lancamentosHora.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const itemRows = await executor
      .select()
      .from(lancamentosItens)
      .where(eq(lancamentosItens.lancamentoId, row.id))
      .orderBy(asc(lancamentosItens.startAt));

    return mapHeaderRowToDomain(row, itemRows);
  }

  public async findManyByIds(
    ids: string[],
    context?: TransactionContext,
  ): Promise<WorkLog[]> {
    if (ids.length === 0) {
      return [];
    }

    const executor = resolveExecutor(context);
    const rows = await executor
      .select()
      .from(lancamentosHora)
      .where(inArray(lancamentosHora.id, ids))
      .orderBy(asc(lancamentosHora.data), asc(lancamentosHora.createdAt));

    if (rows.length === 0) {
      return [];
    }

    const itemRows = await executor
      .select()
      .from(lancamentosItens)
      .where(
        inArray(
          lancamentosItens.lancamentoId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(lancamentosItens.startAt));

    const itemsByWorkLogId = new Map<string, LancamentoItemRow[]>();
    for (const itemRow of itemRows) {
      const current = itemsByWorkLogId.get(itemRow.lancamentoId) ?? [];
      current.push(itemRow);
      itemsByWorkLogId.set(itemRow.lancamentoId, current);
    }

    return rows.map((row) =>
      mapHeaderRowToDomain(row, itemsByWorkLogId.get(row.id) ?? []),
    );
  }

  public async findByPersonClientAndDate(
    personId: string,
    clientId: string,
    date: string,
    context?: TransactionContext,
  ): Promise<WorkLog | null> {
    const executor = resolveExecutor(context);
    const rows = await executor
      .select()
      .from(lancamentosHora)
      .where(
        and(
          eq(lancamentosHora.pessoaId, personId),
          eq(lancamentosHora.clienteId, clientId),
          eq(lancamentosHora.data, date),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const itemRows = await executor
      .select()
      .from(lancamentosItens)
      .where(eq(lancamentosItens.lancamentoId, row.id))
      .orderBy(asc(lancamentosItens.startAt));

    return mapHeaderRowToDomain(row, itemRows);
  }

  public async list(
    filters: WorkLogListFilters,
    context?: TransactionContext,
  ): Promise<WorkLog[]> {
    const executor = resolveExecutor(context);
    const conditions = [eq(lancamentosHora.pessoaId, filters.personId)];

    if (filters.clientId) {
      conditions.push(eq(lancamentosHora.clienteId, filters.clientId));
    }

    if (filters.status) {
      conditions.push(eq(lancamentosHora.statusFaturamento, filters.status));
    }

    if (filters.from) {
      conditions.push(gte(lancamentosHora.data, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(lancamentosHora.data, filters.to));
    }

    const rows = await executor
      .select()
      .from(lancamentosHora)
      .where(and(...conditions))
      .orderBy(asc(lancamentosHora.data), asc(lancamentosHora.createdAt));

    if (rows.length === 0) {
      return [];
    }

    const itemRows = await executor
      .select()
      .from(lancamentosItens)
      .where(
        inArray(
          lancamentosItens.lancamentoId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(lancamentosItens.startAt));

    const itemsByWorkLogId = new Map<string, LancamentoItemRow[]>();
    for (const itemRow of itemRows) {
      const current = itemsByWorkLogId.get(itemRow.lancamentoId) ?? [];
      current.push(itemRow);
      itemsByWorkLogId.set(itemRow.lancamentoId, current);
    }

    return rows.map((row) =>
      mapHeaderRowToDomain(row, itemsByWorkLogId.get(row.id) ?? []),
    );
  }

  public async save(
    workLog: WorkLog,
    context?: TransactionContext,
  ): Promise<void> {
    const executor = resolveExecutor(context);

    if (context) {
      await executor
        .insert(lancamentosHora)
        .values(toHeaderInsert(workLog))
        .onConflictDoUpdate({
          target: lancamentosHora.id,
          set: {
            pessoaId: workLog.personId,
            clienteId: workLog.clientId,
            data: workLog.workDate,
            horaInicio: workLog.startAt,
            horaFim: workLog.endAt,
            breakMin: workLog.totalBreakMinutes,
            duracaoMin: workLog.totalPayableMinutes,
            adicionalDiaCents: workLog.dailyAdditionalCents,
            valorTotalCents: workLog.totalCents,
            observacoes: workLog.notes,
            statusFaturamento: workLog.status,
            updatedAt: new Date(),
          },
        });

      await executor
        .delete(lancamentosItens)
        .where(eq(lancamentosItens.lancamentoId, workLog.id));

      if (workLog.items.length > 0) {
        await executor
          .insert(lancamentosItens)
          .values(workLog.items.map((item) => toItemInsert(workLog.id, item)));
      }

      return;
    }

    await executor.transaction(async (tx) => {
      await tx
        .insert(lancamentosHora)
        .values(toHeaderInsert(workLog))
        .onConflictDoUpdate({
          target: lancamentosHora.id,
          set: {
            pessoaId: workLog.personId,
            clienteId: workLog.clientId,
            data: workLog.workDate,
            horaInicio: workLog.startAt,
            horaFim: workLog.endAt,
            breakMin: workLog.totalBreakMinutes,
            duracaoMin: workLog.totalPayableMinutes,
            adicionalDiaCents: workLog.dailyAdditionalCents,
            valorTotalCents: workLog.totalCents,
            observacoes: workLog.notes,
            statusFaturamento: workLog.status,
            updatedAt: new Date(),
          },
        });

      await tx
        .delete(lancamentosItens)
        .where(eq(lancamentosItens.lancamentoId, workLog.id));

      if (workLog.items.length > 0) {
        await tx
          .insert(lancamentosItens)
          .values(workLog.items.map((item) => toItemInsert(workLog.id, item)));
      }
    });
  }

  public async delete(id: string, context?: TransactionContext): Promise<void> {
    const executor = resolveExecutor(context);
    await executor.delete(lancamentosHora).where(eq(lancamentosHora.id, id));
  }
}
