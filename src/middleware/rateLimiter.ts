import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,// 15 min

  max: 1000, // 

  message: {
    success: false,
    message: "Too many requests",
  },

  standardHeaders: true,

  legacyHeaders: false,
});
