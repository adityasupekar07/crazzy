import { prisma }
from "../../db/index.js";


/**
 * =====================================================
 * GENERATE ADVANCE NUMBER
 * =====================================================
 */

export const generateAdvanceNumber =
  async () => {

    const lastAdvance =
      await prisma.advance.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

    if (!lastAdvance) {
      return "ADV-0001";
    }

    const lastNumber =
      parseInt(
        lastAdvance.advanceNumber.split("-")[1]
      );

    const nextNumber =
      lastNumber + 1;

    return `ADV-${String(nextNumber).padStart(
      4,
      "0"
    )}`;
  };