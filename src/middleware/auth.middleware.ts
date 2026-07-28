import jwt from "jsonwebtoken";

import { Request, Response, NextFunction } from "express";

import { prisma } from "../db/index.js";

import ApiError from "../utils/ApiError.js";

import asyncHandler from "../utils/asyncHandler.js";


 // JWT PAYLOAD TYPE 
interface JwtPayload {
  id: string;
}

// EXTEND EXPRESS REQUEST

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// AUTH MIDDLEWARE

const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {

    //GET AUTHORIZATION HEADER
    const authHeader = req.headers.authorization;

    // CHECK TOKEN EXISTS

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized access", {
        code: "NO_TOKEN",
      });
    }

    // EXTRACT TOKEN

    const token = authHeader.split(" ")[1];

    /**
     * =============================================
     * VERIFY JWT
     * =============================================
     */

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,

        process.env.JWT_SECRET!,
      ) as JwtPayload;
    } catch {
      throw new ApiError(401, "Invalid or expired token", {
        code: "INVALID_TOKEN",
      });
    }

    /**
     * =============================================
     * FIND ADMIN
     * =============================================
     */

    const admin = await prisma.admin.findUnique({
      where: {
        id: decoded.id,
      },

      /**
       * NEVER RETURN PASSWORD
       */

      select: {
        id: true,

        ownerName: true,

        mobile: true,

        dairyName: true,

        village: true,

        taluka: true,

        district: true,

        state: true,

        collectionType: true,

        milkType: true,

        collectionShift: true,

        paymentPeriod: true,

        createdAt: true,

        updatedAt: true,
      },
    });

    /**
     * =============================================
     * CHECK ADMIN EXISTS
     * =============================================
     */

    if (!admin) {
      throw new ApiError(401, "Admin not found", {
        code: "ADMIN_NOT_FOUND",
      });
    }

    /**
     * =============================================
     * ATTACH USER
     * =============================================
     */

    req.user = admin;

    next();
  },
);

export default authMiddleware;
