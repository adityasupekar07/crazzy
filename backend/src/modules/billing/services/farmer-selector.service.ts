import { BillingRepository } from '../repositories/billing.repository.js';
import { PaginatedBillingFarmers } from '../types/billing.types.js';

export class FarmerSelectorService {
  public static async listFarmersForBilling(
    adminId: string,
    query: { search?: string; page: number; limit: number }
  ): Promise<PaginatedBillingFarmers> {
    return BillingRepository.findFarmersWithOutstandingBalances(adminId, query);
  }
}

