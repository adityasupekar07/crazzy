import ApiError from '../../../utils/ApiError.js';

export interface SettlementValidationInput {
  grossAmount: number;
  requestedFeedDeduction: number;
  requestedAdvanceDeduction: number;
  totalPendingFeed: number;
  totalPendingAdvance: number;
}

/**
 * Validates financial eligibility and deduction constraints prior to preview or settlement.
 */
export class SettlementValidationService {
  public static validateDeductions(input: SettlementValidationInput): void {
    const {
      grossAmount,
      requestedFeedDeduction,
      requestedAdvanceDeduction,
      totalPendingFeed,
      totalPendingAdvance,
    } = input;

    if (grossAmount < 0) {
      throw new ApiError(400, 'Gross milk bill amount cannot be negative');
    }

    if (requestedFeedDeduction < 0) {
      throw new ApiError(400, 'Feed deduction cannot be a negative number');
    }

    if (requestedAdvanceDeduction < 0) {
      throw new ApiError(400, 'Advance deduction cannot be a negative number');
    }

    if (requestedFeedDeduction > totalPendingFeed) {
      throw new ApiError(
        400,
        `Feed deduction (₹${requestedFeedDeduction.toFixed(2)}) cannot exceed pending feed credit (₹${totalPendingFeed.toFixed(2)})`
      );
    }

    if (requestedAdvanceDeduction > totalPendingAdvance) {
      throw new ApiError(
        400,
        `Advance deduction (₹${requestedAdvanceDeduction.toFixed(2)}) cannot exceed the customer's total pending advance (₹${totalPendingAdvance.toFixed(2)})`
      );
    }

    const totalDeduction = requestedFeedDeduction + requestedAdvanceDeduction;
    if (totalDeduction > grossAmount) {
      throw new ApiError(
        400,
        `Total deductions (₹${totalDeduction.toFixed(2)}) cannot exceed the total milk bill amount (₹${grossAmount.toFixed(2)}). Net payable cannot be negative.`
      );
    }
  }
}

