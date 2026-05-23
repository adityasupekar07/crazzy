// export const getTodayDate =
//   (): string => {
//     return new Date()
//       .toISOString()
//       .split("T")[0];
//   };
export const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
export const getTodayStart = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};
export const getTodayEnd = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
};
