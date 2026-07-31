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
  
app.use(cors());

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