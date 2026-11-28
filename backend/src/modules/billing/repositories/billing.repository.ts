import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Prisma } from '@prisma/client';
import prisma from '../../../db/index.js';
import logger from '../../../config/logger.js';
import { Decimal, ROUND_HALF_UP } from '../../../utils/decimal.js';
import { PaginatedBillingFarmers, SettlementRecord } from '../types/billing.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../../data');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');

function ensureStorage(): SettlementRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SETTLEMENTS_FILE)) {
      fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify([]), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(SETTLEMENTS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    logger.error('Failed reading settlements storage:', err);
    return [];
  }
}

function saveStorage(records: SettlementRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed saving settlements storage:', err);
  }
}

export class BillingRepository {
  public static async findFarmersWithOutstandingBalances(
    adminId: string,
    params: { search?: string; page: number; limit: number }
  ): Promise<PaginatedBillingFarmers> {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    const where: Prisma.CustomerWhereInput = { adminId };

    if (search) {
      const orFilters: Prisma.CustomerWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ];
      if (/^\d+$/.test(search)) {
        const parsedCode = Number(search);
        // Customer.code is PostgreSQL INT4 (max 2,147,483,647); avoid overflow on 10-digit mobile numbers
        if (Number.isInteger(parsedCode) && parsedCode >= 0 && parsedCode <= 2147483647) {
          orFilters.push({ code: parsedCode });
        }
      }
      where.OR = orFilters;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          mobile: true,
          isActive: true,
        },
      }),
    ]);

    const feedMap = new Map<string, string>();
    const advanceMap = new Map<string, string>();

    if (customers.length > 0) {
      const customerIds = customers.map((c) => c.id);

      const [feedAgg, advanceAgg] = await Promise.all([
        prisma.foodSale.groupBy({
          by: ['customerId'],
          where: {
            adminId,
            customerId: { in: customerIds },
            isActive: true,
            pendingAmount: { gt: 0 },
          },
          _sum: { pendingAmount: true },
        }),
        prisma.advance.groupBy({
          by: ['customerId'],
          where: {
            adminId,
            customerId: { in: customerIds },
            status: { in: ['ACTIVE', 'PARTIALLY_RECOVERED'] },
            pendingAmount: { gt: 0 },
          },
          _sum: { pendingAmount: true },
        }),
      ]);

      for (const row of feedAgg) {
        const val = row._sum.pendingAmount ?? 0;
        feedMap.set(
          row.customerId,
          new Decimal(val.toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2)
        );
      }

      for (const row of advanceAgg) {
        const val = row._sum.pendingAmount ?? 0;
        advanceMap.set(
          row.customerId,
          new Decimal(val.toString()).toDecimalPlaces(2, ROUND_HALF_UP).toFixed(2)
        );
      }
    }

    return {
      farmers: customers.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        mobile: c.mobile,
        isActive: c.isActive,
        outstandingFeedAmount: feedMap.get(c.id) ?? '0.00',
        outstandingAdvanceAmount: advanceMap.get(c.id) ?? '0.00',
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  public static async findCustomerForDairy(adminId: string, customerId: string) {
    return prisma.customer.findFirst({
      where: { id: customerId, adminId },
      select: {
        id: true,
        code: true,
        name: true,
        mobile: true,
        isActive: true,
      },
    });
  }

  public static async findDairyPaymentPeriod(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { paymentPeriod: true },
    });
    return admin?.paymentPeriod;
  }

  public static async saveSettlement(record: SettlementRecord): Promise<SettlementRecord> {
    const allRecords = ensureStorage();
    allRecords.unshift(record);
    saveStorage(allRecords);
    return record;
  }

  public static async findSettlementsByAdmin(
    adminId: string,
    customerId?: string
  ): Promise<SettlementRecord[]> {
    const allRecords = ensureStorage();
    return allRecords.filter((r) => {
      if (r.adminId !== adminId) return false;
      if (customerId && r.customerId !== customerId) return false;
      return true;
    });
  }
}

