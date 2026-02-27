import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import identifyRoutes from "./routes/identify.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bitespeed Identity Reconciliation API is running 🚀");
});

// 🔥 Mount identify route
app.use("/identify", identifyRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});