import { prisma }
from "../../db/index.js";

import ApiError
from "../../utils/ApiError.js";

import { generateAdvanceNumber }
from "./advance.utils.js";

/**
 * =====================================================
 * CREATE ADVANCE
 * =====================================================
 */

export const createAdvance =
  async (
    data: any,
    adminId: string
  ) => {

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          adminId,
        },
      });

    if (!customer) {
      throw new ApiError(
        404,
        "Customer not found"
      );
    }

    const advanceNumber =
      await generateAdvanceNumber();

      const parsedDate =
  new Date(data.givenDate);

if (
  isNaN(parsedDate.getTime())
) {
  throw new ApiError(
    400,
    "Invalid given date"
  );
}


    return prisma.$transaction(
      async (tx) => {

        const advance =
          await tx.advance.create({
            data: {

              adminId,

              customerId:
                data.customerId,

              advanceNumber,

              originalAmount:
                data.amount,

              recoveredAmount: 0,

              pendingAmount:
                data.amount,

              status: "ACTIVE",

              notes:
                data.notes,

              givenDate: parsedDate,

              createdBy:
                adminId,
            },
          });

        await tx.advanceTransaction.create({
          data: {

            advanceId:
              advance.id,

            type:
              "ISSUED",

            amount:
              data.amount,

            notes:
              data.notes,

            createdBy:
              adminId,
          },
        });

        return advance;
      }
    );
  };

/**
 * =====================================================
 * GET ALL ADVANCES
 * =====================================================
 */

export const getAllAdvances =
  async (
    query: any,
    adminId: string
  ) => {

    const page =
      Number(query.page) || 1;

    const limit =
      Number(query.limit) || 10;

    const skip =
      (page - 1) * limit;

    const search =
      String(query.search || "");

    const status =
      query.status;

    const where: any = {
      adminId,
    };

    /**
     * STATUS FILTER
     */

    if (status) {
      where.status = status;
    }

    /**
     * SEARCH FILTER
     */

    if (search) {

      where.OR = [

        {
          advanceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          customer: {
            is: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },

        {
          customer: {
            is: {
              mobile: {
                contains: search,
              },
            },
          },
        },
      ];
    }

    const [advances, total] =
      await Promise.all([

        prisma.advance.findMany({

          where,

          include: {

            customer: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },

            transactions: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          skip,

          take: limit,
        }),

        prisma.advance.count({
          where,
        }),
      ]);

    return {

      advances,

      pagination: {

        total,

        page,

        limit,

        totalPages:
          Math.ceil(total / limit),
      },
    };
  };

/**
 * =====================================================
 * GET ADVANCE BY ID
 * =====================================================
 */

export const getAdvanceById =
  async (
    advanceId: string,
    adminId: string
  ) => {

    const advance =
      await prisma.advance.findFirst({

        where: {

          id: advanceId,

          adminId,
        },

        include: {

          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },

          transactions: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!advance) {
      throw new ApiError(
        404,
        "Advance not found"
      );
    }

    return advance;
  };

/**
 * =====================================================
 * GET CUSTOMER ADVANCES
 * =====================================================
 */

export const getCustomerAdvances =
  async (
    customerId: string,
    adminId: string
  ) => {

    const customer =
      await prisma.customer.findFirst({

        where: {

          id: customerId,

          adminId,
        },
      });

    if (!customer) {
      throw new ApiError(
        404,
        "Customer not found"
      );
    }

    const advances =
      await prisma.advance.findMany({

        where: {

          customerId,

          adminId,
        },

        include: {

          transactions: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const summary =
      advances.reduce(

        (acc: any, item: any) => {

          acc.totalAdvance +=
            Number(item.originalAmount);

          acc.totalRecovered +=
            Number(item.recoveredAmount);

          acc.totalPending +=
            Number(item.pendingAmount);

          return acc;
        },

        {
          totalAdvance: 0,
          totalRecovered: 0,
          totalPending: 0,
        }
      );

    return {

      customer: {

        id: customer.id,

        name: customer.name,

        mobile: customer.mobile,
      },

      summary,

      advances,
    };
  };

/**
 * =====================================================
 * ADD REPAYMENT
 * =====================================================
 */

export const addRepayment =
  async (
    advanceId: string,
    data: any,
    adminId: string
  ) => {

    if (data.amount <= 0) {
      throw new ApiError(
        400,
        "Invalid repayment amount"
      );
    }

    return prisma.$transaction(
      async (tx) => {

        const advance =
          await tx.advance.findFirst({

            where: {

              id: advanceId,

              adminId,
            },
          });

        if (!advance) {
          throw new ApiError(
            404,
            "Advance not found"
          );
        }

        if (
          advance.status === "CLOSED"
        ) {
          throw new ApiError(
            400,
            "Advance already closed"
          );
        }

        const pendingAmount =
          Number(
            advance.pendingAmount
          );

        if (
          data.amount >
          pendingAmount
        ) {
          throw new ApiError(
            400,
            "Repayment amount exceeds pending amount"
          );
        }

        const recoveredAmount =
          Number(
            advance.recoveredAmount
          ) + data.amount;

        const remainingPending =
          pendingAmount -
          data.amount;

        const status =
          remainingPending === 0
            ? "CLOSED"
            : "PARTIALLY_RECOVERED";

        await tx.advanceTransaction.create({
          data: {

            advanceId,

            type:
              "MANUAL_REPAYMENT",

            amount:
              data.amount,

            notes:
              data.notes,

            createdBy:
              adminId,
          },
        });

        const updatedAdvance =
          await tx.advance.update({

            where: {
              id: advanceId,
            },

            data: {

              recoveredAmount,

              pendingAmount:
                remainingPending,

              status,
            },
          });

        return updatedAdvance;
      }
    );
  };