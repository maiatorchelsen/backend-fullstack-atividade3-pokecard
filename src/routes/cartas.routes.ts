import { Router } from "express";
import {
  atualizarCarta,
  buscarCarta,
  criarCarta,
  excluirCarta,
  listarCartas,
  obterResumo
} from "../controllers/cartas.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

export const cartasRouter = Router();

cartasRouter.use(authMiddleware);

cartasRouter.get("/", listarCartas);
cartasRouter.get("/resumo", obterResumo);
cartasRouter.get("/:id", buscarCarta);
cartasRouter.post("/", criarCarta);
cartasRouter.put("/:id", atualizarCarta);
cartasRouter.delete("/:id", excluirCarta);
