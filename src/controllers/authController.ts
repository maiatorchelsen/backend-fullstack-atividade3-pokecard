import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { obterJwtSecret } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

const registroSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres.")
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  senha: z.string().min(1, "Senha é obrigatória.")
});

export async function register(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const resultado = registroSchema.safeParse(request.body);

    if (!resultado.success) {
      response.status(400).json({
        mensagem: "Dados inválidos.",
        erros: resultado.error.flatten().fieldErrors
      });
      return;
    }

    const { nome, email, senha } = resultado.data;

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      response.status(409).json({ mensagem: "E-mail já cadastrado." });
      return;
    }

    const senhaHash = await hash(senha, 10);
    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash },
      select: { id: true, nome: true, email: true, criadoEm: true }
    });

    response.status(201).json(usuario);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      response.status(409).json({ mensagem: "E-mail já cadastrado." });
      return;
    }

    next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const resultado = loginSchema.safeParse(request.body);

    if (!resultado.success) {
      response.status(400).json({
        mensagem: "Dados inválidos.",
        erros: resultado.error.flatten().fieldErrors
      });
      return;
    }

    const { email, senha } = resultado.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    const senhaValida = usuario
      ? await compare(senha, usuario.senhaHash)
      : false;

    if (!usuario || !senhaValida) {
      response.status(401).json({ mensagem: "E-mail ou senha inválidos." });
      return;
    }

    const token = jwt.sign(
      { usuarioId: usuario.id },
      obterJwtSecret(),
      { expiresIn: "7d" }
    );

    response.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  } catch (error) {
    next(error);
  }
}
