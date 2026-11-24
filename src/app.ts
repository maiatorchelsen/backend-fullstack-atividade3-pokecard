import cors from "cors";
import express from "express";
import { Prisma } from "@prisma/client";
import { authRouter } from "./routes/authRoutes.js";
import { cartasRouter } from "./routes/cartas.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/auth", authRouter);
app.use("/cartas", cartasRouter);
app.use((_request, response) => {
  response.status(404).json({ mensagem: "Rota não encontrada." });
});
app.use((
  error: unknown,
  _request: express.Request,
  response: express.Response,
  _next: express.NextFunction
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response.status(400).json({
        mensagem: "Já existe uma carta com essa coleção e número."
      });
      return;
    }

    if (error.code === "P2025") {
      response.status(404).json({ mensagem: "Carta não encontrada." });
      return;
    }
  }

  console.error(error);
  response.status(500).json({ mensagem: "Erro interno do servidor." });
});
