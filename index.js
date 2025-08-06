import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./src/routes/authRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api", userRoutes);
app.use("/api", customerRoutes);

// app.get("/test-db", async (req, res) => {
//   try {
//     await prisma.$connect();
//     res.send("✅ Database connected successfully!");
//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//     res.status(500).send("❌ Failed to connect to DB");
//   }
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
