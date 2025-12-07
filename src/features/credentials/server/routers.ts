import { generateSlug } from "random-word-slugs";
import prisma from "@/lib/db";
import { polarClient } from "@/lib/polar";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { CredentialType } from "@prisma/client";

export const credentialRouter = createTRPCRouter({
  create: premiumProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(CredentialType),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(({ ctx, input }) => {
      const { name, value, type } = input;

      return prisma.credential.create({
        data: {
          name,
          userId: ctx.auth.user.id,
          type,
          value, //TODO: Consider encrypting in production
        },
      });
    }),

  remove: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return prisma.credential.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        type: z.enum(CredentialType),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, name, type, value } = input;

      return prisma.credential.update({
        where: { id, userId: ctx.auth.user.id },
        data: {
          name,
          type,
          value, //TODO :Consider encrypting in production
        },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.credential.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const [items, totalCount] = await Promise.all([
        prisma.credential.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.credential.count({
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),

  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum(CredentialType),
      })
    )
    .query(({ input, ctx }) => {
      const { type } = input;

      return prisma.credential.findMany({
        where: { type, userId: ctx.auth.user.id },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }),

  /**
   * Check if user is within a trial using Polar customer state
   */
  checkFreeTrial: protectedProcedure.query(async ({ ctx }) => {
    const state = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    });

    const subscriptions =
      // Polar SDK may return either snake_case or camelCase keys depending on client
      // shape, so support both to avoid runtime errors.
      (state as any).active_subscriptions ??
      (state as any).activeSubscriptions ??
      [];

    const now = Date.now();

    const trialingSubscription = subscriptions.find((sub: any) => {
      const trialEndRaw = sub?.trial_end ?? sub?.trialEnd;
      if (!trialEndRaw) return false;
      const trialEndTs = new Date(trialEndRaw).getTime();
      return Number.isFinite(trialEndTs) && trialEndTs > now;
    });

    const trialEndRaw =
      trialingSubscription?.trial_end ?? trialingSubscription?.trialEnd;
    const trialEndDate = trialEndRaw ? new Date(trialEndRaw) : null;
    const daysRemaining = trialEndDate
      ? Math.max(
          0,
          Math.ceil((trialEndDate.getTime() - now) / (1000 * 60 * 60 * 24))
        )
      : 0;

    return {
      isInTrial: Boolean(trialEndDate && trialEndDate.getTime() > now),
      daysRemaining,
      trialEndDate,
    };
  }),
});
