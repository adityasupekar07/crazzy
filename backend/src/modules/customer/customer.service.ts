import { prisma } from "../../db/index.js";
import ApiError from "../../utils/ApiError.js";

/**
 * =====================================================
 * ADD CUSTOMER
 * =====================================================
 */

export const addCustomer = async (data: any) => {
  const rawCode = data.customerCode ?? data.code;
  const rawName = data.fullName ?? data.name ?? "";
  const codeNum = typeof rawCode === "number" ? rawCode : parseInt(String(rawCode), 10);
  const finalCode = isNaN(codeNum) ? 0 : codeNum;

  /**
   * CHECK EXISTING CODE
   */
  const existingCode = await prisma.customer.findFirst({
    where: {
      adminId: data.adminId,
      code: finalCode,
    },
  });

  if (existingCode) {
    throw new ApiError(400, "Customer code already exists. Please enter a different code.");
  }

  /**
   * CHECK EXISTING MOBILE
   */
  const existingMobile = await prisma.customer.findFirst({
    where: {
      adminId: data.adminId,
      mobile: data.mobile,
    },
  });

  if (existingMobile) {
    throw new ApiError(400, "Customer with this mobile number already exists");
  }

  /**
   * CREATE CUSTOMER
   */
  return prisma.customer.create({
    data: {
      adminId: data.adminId,
      code: finalCode,
      name: rawName,
      mobile: data.mobile,
      address: data.address ?? "",
      milkType: data.milkType,
    },
  });
};

/**
 * =====================================================
 * GET CUSTOMERS
 * =====================================================
 */

export const getCustomers = async (adminId: string) => {
  const [customers, advanceAggs] = await Promise.all([
    prisma.customer.findMany({
      where: {
        adminId,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.advance.groupBy({
      by: ["customerId"],
      where: {
        adminId,
        status: { in: ["ACTIVE", "PARTIALLY_RECOVERED"] },
        pendingAmount: { gt: 0 },
      },
      _sum: {
        pendingAmount: true,
      },
    }),
  ]);

  const advanceMap = new Map<string, number>();
  for (const row of advanceAggs) {
    advanceMap.set(row.customerId, Number(row._sum.pendingAmount ?? 0));
  }

  return customers.map((customer) => ({
    ...customer,
    advanceBalance: advanceMap.get(customer.id) ?? 0,
  }));
};

export const getCustomerById = async (id: string, adminId: string) => {
  const [customer, advanceAgg] = await Promise.all([
    prisma.customer.findFirst({
      where: { id, adminId },
    }),
    prisma.advance.aggregate({
      where: {
        adminId,
        customerId: id,
        status: { in: ["ACTIVE", "PARTIALLY_RECOVERED"] },
        pendingAmount: { gt: 0 },
      },
      _sum: {
        pendingAmount: true,
      },
    }),
  ]);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
  return {
    ...customer,
    advanceBalance: Number(advanceAgg._sum.pendingAmount ?? 0),
  };
};

export const updateCustomer = async (id: string, data: any, adminId: string) => {
  const existing = await prisma.customer.findFirst({
    where: { id, adminId }
  });
  if (!existing) {
    throw new ApiError(404, "Customer not found");
  }

  if (data.mobile && data.mobile !== existing.mobile) {
    const mobileExists = await prisma.customer.findFirst({
      where: { adminId, mobile: data.mobile }
    });
    if (mobileExists) throw new ApiError(400, "Customer with this mobile number already exists");
  }

  const rawName = data.fullName ?? data.name;
  
  return prisma.customer.update({
    where: { id },
    data: {
      name: rawName !== undefined ? rawName : undefined,
      mobile: data.mobile,
      address: data.address,
      milkType: data.milkType,
    }
  });
};

export const toggleCustomerStatus = async (id: string, adminId: string) => {
  const existing = await prisma.customer.findFirst({
    where: { id, adminId }
  });
  if (!existing) {
    throw new ApiError(404, "Customer not found");
  }
  const nextStatus = existing.isActive !== undefined ? !existing.isActive : false;
  return prisma.customer.update({
    where: { id },
    data: {
      isActive: nextStatus,
    }
  });
};

export const debugService = async () => {
  console.log('\n========================');
  console.log('[DEBUG SERVICE HIT]');
  console.log('========================');

  const totalCustomers = await prisma.customer.count();

  console.log('[DEBUG SERVICE DB SUCCESS]');

  return {
    totalCustomers,
    timestamp: new Date(),
  };
};