export const cacheKeys = {

  /**
   * ALL CHARTS
   */

  allCharts: (
    adminId: string
  ) =>
    `all-charts:${adminId}`,

  /**
   * ACTIVE CHART
   */

  activeChart: (
    adminId: string,
    milkType: string,
    category: string,
    method: string
  ) =>
    `active-chart:${adminId}:${milkType}:${category}:${method}`,

  /**
   * SINGLE CHART
   */

  singleChart: (
    id: string
  ) =>
    `single-chart:${id}`,


    milkEntriesByDate: (
  adminId: string,
  date: string,
  page: number,
  limit: number
) =>
  `milk-entries-by-date:${adminId}:${date}:${page}:${limit}`,


    todayMilkEntries: (
  adminId: string,
  date: string
) =>
  `today-milk-entries:${adminId}:${date}`,
};
