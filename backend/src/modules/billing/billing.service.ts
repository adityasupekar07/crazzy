import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../db/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../config/logger.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');

export interface CreateSettlementInput {
  customerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  netPayable: number;
  advanceDeductionAmount?: number;
  litres?: number;
  avgFat?: number;
  avgSnf?: number;
  milkEntryIds?: string[];
  remarks?: string;
}

export interface SettlementRecord {
  id: string;
  adminId: string;
  customerId: string;
  customerName: string;
  customerCode: number;
  startDate: string;
  endDate: string;
  period: string;
  litres: number;
  avgFat: number;
  avgSnf: number;
  grossAmount: number;
  advanceDeductionAmount: number;
  netPayable: number;
  milkEntryCount: number;
  milkEntryIds: string[];
  remarks?: string;
  createdAt: string;
}

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

export const createSettlement = async (
  adminId: string,
  payload: CreateSettlementInput
): Promise<SettlementRecord> => {
  const {
    customerId,
    startDate,
    endDate,
    totalAmount,
    netPayable,
    advanceDeductionAmount = 0,
    litres = 0,
    avgFat = 0,
    avgSnf = 0,
    milkEntryIds = [],
    remarks,
  } = payload;

  if (!customerId || !startDate || !endDate) {
    throw new ApiError(400, 'Customer ID, start date, and end date are required');
  }

  // Verify customer belongs to admin
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      adminId,
    },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found or access denied');
  }

  const grossAmount = Math.max(0, Number(totalAmount) || 0);
  const requestedDeduction = Number(advanceDeductionAmount) || 0;

  if (requestedDeduction < 0) {
    throw new ApiError(400, 'Advance deduction cannot be a negative number');
  }

  // Fetch active advances for this customer
  const activeAdvances = await prisma.advance.findMany({
    where: {
      customerId,
      adminId,
      status: { in: ['ACTIVE', 'PARTIALLY_RECOVERED'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  const totalPendingAdvance = activeAdvances.reduce(
    (sum, adv) => sum + Number(adv.pendingAmount || 0),
    0
  );

  // STRICT VALIDATION: Cannot deduct more than gross milk bill amount
  if (requestedDeduction > grossAmount) {
    throw new ApiError(
      400,
      `Advance deduction (₹${requestedDeduction.toFixed(2)}) cannot exceed the total milk bill amount (₹${grossAmount.toFixed(2)}). Net payable cannot be negative.`
    );
  }

  // STRICT VALIDATION: Cannot deduct more than farmer's active pending advance
  if (requestedDeduction > totalPendingAdvance) {
    throw new ApiError(
      400,
      `Advance deduction (₹${requestedDeduction.toFixed(2)}) cannot exceed the customer's total pending advance (₹${totalPendingAdvance.toFixed(2)})`
    );
  }

  const finalDeduction = requestedDeduction;
  const calculatedNetPayable = Math.max(0, Number((grossAmount - finalDeduction).toFixed(2)));

  const record: SettlementRecord = {
    id: `settle_${crypto.randomBytes(8).toString('hex')}`,
    adminId,
    customerId,
    customerName: customer.name,
    customerCode: customer.code,
    startDate,
    endDate,
    period: `${startDate} to ${endDate}`,
    litres: Number(litres) || 0,
    avgFat: Number(avgFat) || 0,
    avgSnf: Number(avgSnf) || 0,
    grossAmount: grossAmount,
    advanceDeductionAmount: finalDeduction,
    netPayable: calculatedNetPayable,
    milkEntryCount: milkEntryIds.length,
    milkEntryIds,
    remarks,
    createdAt: new Date().toISOString(),
  };

  const allRecords = ensureStorage();
  allRecords.unshift(record);
  saveStorage(allRecords);

  // Process advance deduction if provided
  if (finalDeduction > 0) {
    let remainingDeduction = finalDeduction;
    
    for (const adv of activeAdvances) {
      if (remainingDeduction <= 0) break;
      
      const deductAmt = Math.min(remainingDeduction, Number(adv.pendingAmount));
      
      const newPending = Number(adv.pendingAmount) - deductAmt;
      const newRecovered = Number(adv.recoveredAmount) + deductAmt;
      const newStatus = newPending === 0 ? 'CLOSED' : 'PARTIALLY_RECOVERED';

      await prisma.$transaction(async (tx) => {
        await tx.advanceTransaction.create({
          data: {
            advanceId: adv.id,
            type: 'MANUAL_REPAYMENT',
            amount: deductAmt,
            notes: `Auto-deducted during bill settlement (${startDate} to ${endDate})`,
            createdBy: adminId
          }
        });

        await tx.advance.update({
          where: { id: adv.id },
          data: {
            pendingAmount: newPending,
            recoveredAmount: newRecovered,
            status: newStatus
          }
        });
      });

      remainingDeduction -= deductAmt;
    }
  }

  logger.info(`Settlement created: ${record.id} for farmer ${customer.name} (Gross: ₹${grossAmount}, Deduction: ₹${finalDeduction}, Net: ₹${calculatedNetPayable})`);
  return record;
};

export const getBillingHistory = async (
  adminId: string,
  customerId?: string
): Promise<SettlementRecord[]> => {
  const allRecords = ensureStorage();
  return allRecords.filter((r) => {
    if (r.adminId !== adminId) return false;
    if (customerId && r.customerId !== customerId) return false;
    return true;
  });
};
