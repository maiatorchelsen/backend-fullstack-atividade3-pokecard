import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { obterJwtSecret } from "../lib/jwt.js";

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization = request.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!token) {
    response.status(401).json({
      mensagem: "Token de autenticação ausente ou inválido."
    });
    return;
  }

  const secret = obterJwtSecret();

  try {
    const payload = jwt.verify(token, secret);

    if (typeof payload === "string" || typeof payload.usuarioId !== "string") {
      response.status(401).json({ mensagem: "Token de autenticação inválido." });
      return;
    }

    request.usuarioId = payload.usuarioId;
    next();
  } catch {
    response.status(401).json({
      mensagem: "Token de autenticação inválido ou expirado."
    });
  }
}
