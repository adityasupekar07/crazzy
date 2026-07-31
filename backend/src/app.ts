import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression"; 
import cookieParser from "cookie-parser";
import hpp from "hpp";
import morgan from "morgan";
import routes from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();
  
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(cookieParser());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));



app.use(hpp());

app.use(apiLimiter);

app.get("/", (req, res) => {
  res.send("Dairy API Running");
});

app.use("/api/v1", routes);
app.use(errorMiddleware);

export default app;