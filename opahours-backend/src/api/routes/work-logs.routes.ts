import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import type {
  CreateWorkLogInput,
  UpdateWorkLogInput,
  WorkLogItemInput,
} from "../../application/work-logs/services/workLogService.js";
import { WorkLogService } from "../../application/work-logs/services/workLogService.js";

const workLogService = new WorkLogService();

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const uuidSchema = z.string().uuid();
const workLogStatusSchema = z.enum(["draft", "linked", "invoiced"]);

const workLogItemSchema = z.object({
  id: uuidSchema.optional(),
  location: z.string().trim().min(2).max(255),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  breakMinutes: z.number().int().min(0),
  hourlyRateCents: z.number().int().positive(),
  additionalCents: z.number().int().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const createWorkLogBodySchema = z.object({
  personId: uuidSchema,
  clientId: uuidSchema,
  workDate: isoDateSchema,
  notes: z.string().trim().max(1000).nullable().optional(),
  dailyAdditionalCents: z.number().int().optional(),
  items: z.array(workLogItemSchema).optional(),
});

const updateWorkLogBodySchema = z
  .object({
    personId: uuidSchema.optional(),
    clientId: uuidSchema.optional(),
    workDate: isoDateSchema.optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    dailyAdditionalCents: z.number().int().optional(),
    items: z.array(workLogItemSchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const workLogParamsSchema = z.object({
  id: uuidSchema,
});

const workLogQuerySchema = z.object({
  personId: uuidSchema,
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  clientId: uuidSchema.optional(),
  status: workLogStatusSchema.optional(),
});

const errorSchema = {
  type: "object",
  required: ["code", "message", "details", "requestId"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    details: {
      anyOf: [{ type: "object", additionalProperties: true }, { type: "null" }],
    },
    requestId: { type: "string" },
  },
};

const workLogItemResponseSchema = {
  type: "object",
  required: [
    "id",
    "location",
    "startAt",
    "endAt",
    "breakMinutes",
    "payableMinutes",
    "hourlyRateCents",
    "additionalCents",
    "totalCents",
    "notes",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    location: { type: "string" },
    startAt: { type: "string", format: "date-time" },
    endAt: { type: "string", format: "date-time" },
    breakMinutes: { type: "integer" },
    payableMinutes: { type: "integer" },
    hourlyRateCents: { type: "integer" },
    additionalCents: { type: "integer" },
    totalCents: { type: "integer" },
    notes: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
};

const workLogResponseSchema = {
  type: "object",
  required: [
    "id",
    "personId",
    "clientId",
    "workDate",
    "notes",
    "dailyAdditionalCents",
    "status",
    "startAt",
    "endAt",
    "totalBreakMinutes",
    "totalWorkedMinutes",
    "totalPayableMinutes",
    "totalCents",
    "items",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    personId: { type: "string", format: "uuid" },
    clientId: { type: "string", format: "uuid" },
    workDate: { type: "string", format: "date" },
    notes: { anyOf: [{ type: "string" }, { type: "null" }] },
    dailyAdditionalCents: { type: "integer" },
    status: { type: "string", enum: ["draft", "linked", "invoiced"] },
    startAt: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    },
    endAt: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    },
    totalBreakMinutes: { type: "integer" },
    totalWorkedMinutes: { type: "integer" },
    totalPayableMinutes: { type: "integer" },
    totalCents: { type: "integer" },
    items: {
      type: "array",
      items: workLogItemResponseSchema,
    },
  },
};

const mapItemInput = (
  item: z.infer<typeof workLogItemSchema>,
): WorkLogItemInput => ({
  id: item.id,
  location: item.location,
  startAt: item.startAt,
  endAt: item.endAt,
  breakMinutes: item.breakMinutes,
  hourlyRateCents: item.hourlyRateCents,
  additionalCents: item.additionalCents,
  notes: item.notes,
});

const mapCreateInput = (
  body: z.infer<typeof createWorkLogBodySchema>,
): CreateWorkLogInput => ({
  personId: body.personId,
  clientId: body.clientId,
  workDate: body.workDate,
  notes: body.notes,
  dailyAdditionalCents: body.dailyAdditionalCents,
  items: body.items?.map(mapItemInput),
});

const mapUpdateInput = (
  body: z.infer<typeof updateWorkLogBodySchema>,
): UpdateWorkLogInput => ({
  personId: body.personId,
  clientId: body.clientId,
  workDate: body.workDate,
  notes: body.notes,
  dailyAdditionalCents: body.dailyAdditionalCents,
  items: body.items?.map(mapItemInput),
});

const serializeWorkLog = (
  workLog: Awaited<ReturnType<WorkLogService["getWorkLogById"]>>,
) => ({
  id: workLog.id,
  personId: workLog.personId,
  clientId: workLog.clientId,
  workDate: workLog.workDate,
  notes: workLog.notes,
  dailyAdditionalCents: workLog.dailyAdditionalCents,
  status: workLog.status,
  startAt: workLog.startAt?.toISOString() ?? null,
  endAt: workLog.endAt?.toISOString() ?? null,
  totalBreakMinutes: workLog.totalBreakMinutes,
  totalWorkedMinutes: workLog.totalWorkedMinutes,
  totalPayableMinutes: workLog.totalPayableMinutes,
  totalCents: workLog.totalCents,
  items: workLog.items.map((item) => ({
    id: item.id,
    location: item.location,
    startAt: item.period.startAt.toISOString(),
    endAt: item.period.endAt.toISOString(),
    breakMinutes: item.breakDuration.minutes,
    payableMinutes: item.payableDuration.minutes,
    hourlyRateCents: item.hourlyRate.cents,
    additionalCents: item.additionalCents,
    totalCents: item.totalCents,
    notes: item.notes,
  })),
});

export const workLogsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/work-logs",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Work Logs"],
        summary: "List work logs",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["personId"],
          properties: {
            personId: { type: "string", format: "uuid" },
            from: { type: "string", format: "date" },
            to: { type: "string", format: "date" },
            clientId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["draft", "linked", "invoiced"] },
          },
        },
        response: {
          200: { type: "array", items: workLogResponseSchema },
          400: errorSchema,
          401: errorSchema,
        },
      },
    },
    async (request) => {
      const query = workLogQuerySchema.parse(request.query);
      const workLogs = await workLogService.listWorkLogs(query);

      return workLogs.map((workLog) => serializeWorkLog(workLog));
    },
  );

  app.get(
    "/work-logs/:id",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Work Logs"],
        summary: "Get work log by id",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: workLogResponseSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request) => {
      const params = workLogParamsSchema.parse(request.params);
      const workLog = await workLogService.getWorkLogById(params.id);

      return serializeWorkLog(workLog);
    },
  );

  app.post(
    "/work-logs",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Work Logs"],
        summary: "Create work log",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["personId", "clientId", "workDate"],
          properties: {
            personId: { type: "string", format: "uuid" },
            clientId: { type: "string", format: "uuid" },
            workDate: { type: "string", format: "date" },
            notes: {
              anyOf: [{ type: "string", maxLength: 1000 }, { type: "null" }],
            },
            dailyAdditionalCents: { type: "integer" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "location",
                  "startAt",
                  "endAt",
                  "breakMinutes",
                  "hourlyRateCents",
                ],
                properties: {
                  id: { type: "string", format: "uuid" },
                  location: { type: "string", minLength: 2, maxLength: 255 },
                  startAt: { type: "string", format: "date-time" },
                  endAt: { type: "string", format: "date-time" },
                  breakMinutes: { type: "integer", minimum: 0 },
                  hourlyRateCents: { type: "integer", minimum: 1 },
                  additionalCents: { type: "integer" },
                  notes: {
                    anyOf: [
                      { type: "string", maxLength: 1000 },
                      { type: "null" },
                    ],
                  },
                },
              },
            },
          },
        },
        response: {
          201: workLogResponseSchema,
          400: errorSchema,
          401: errorSchema,
          409: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const body = createWorkLogBodySchema.parse(request.body);
      const workLog = await workLogService.createWorkLog(mapCreateInput(body));

      reply.code(201);

      return serializeWorkLog(workLog);
    },
  );

  app.put(
    "/work-logs/:id",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Work Logs"],
        summary: "Update work log",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          minProperties: 1,
          properties: {
            personId: { type: "string", format: "uuid" },
            clientId: { type: "string", format: "uuid" },
            workDate: { type: "string", format: "date" },
            notes: {
              anyOf: [{ type: "string", maxLength: 1000 }, { type: "null" }],
            },
            dailyAdditionalCents: { type: "integer" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "location",
                  "startAt",
                  "endAt",
                  "breakMinutes",
                  "hourlyRateCents",
                ],
                properties: {
                  id: { type: "string", format: "uuid" },
                  location: { type: "string", minLength: 2, maxLength: 255 },
                  startAt: { type: "string", format: "date-time" },
                  endAt: { type: "string", format: "date-time" },
                  breakMinutes: { type: "integer", minimum: 0 },
                  hourlyRateCents: { type: "integer", minimum: 1 },
                  additionalCents: { type: "integer" },
                  notes: {
                    anyOf: [
                      { type: "string", maxLength: 1000 },
                      { type: "null" },
                    ],
                  },
                },
              },
            },
          },
        },
        response: {
          200: workLogResponseSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          409: errorSchema,
        },
      },
    },
    async (request) => {
      const params = workLogParamsSchema.parse(request.params);
      const body = updateWorkLogBodySchema.parse(request.body);
      const workLog = await workLogService.updateWorkLog(
        params.id,
        mapUpdateInput(body),
      );

      return serializeWorkLog(workLog);
    },
  );

  app.delete(
    "/work-logs/:id",
    {
      preHandler: [app.authenticate],
      config: { access: "private" },
      schema: {
        tags: ["Work Logs"],
        summary: "Delete work log",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["ok"],
            properties: {
              ok: { type: "boolean" },
            },
          },
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          409: errorSchema,
        },
      },
    },
    async (request) => {
      const params = workLogParamsSchema.parse(request.params);
      await workLogService.deleteWorkLog(params.id);

      return { ok: true };
    },
  );
};
