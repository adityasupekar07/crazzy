export const cacheKeys = {
    /**
     * ALL CHARTS
     */
    allCharts: (adminId) => `all-charts:${adminId}`,
    /**
     * ACTIVE CHART
     */
    activeChart: (adminId, milkType, category, method) => `active-chart:${adminId}:${milkType}:${category}:${method}`,
    /**
     * SINGLE CHART
     */
    singleChart: (id) => `single-chart:${id}`,
    milkEntriesByDate: (adminId, date, page, limit) => `milk-entries-by-date:${adminId}:${date}:${page}:${limit}`,
    todayMilkEntries: (adminId, date) => `today-milk-entries:${adminId}:${date}`,
};
