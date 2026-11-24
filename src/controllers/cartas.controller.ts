import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

type CartaBody = {
  nome?: unknown;
  colecao?: unknown;
  numeroCarta?: unknown;
  tipo?: unknown;
  raridade?: unknown;
  condicao?: unknown;
  quantidade?: unknown;
  valorEstimado?: unknown;
  urlImagem?: unknown;
};

const camposObrigatorios = [
  "nome",
  "colecao",
  "numeroCarta",
  "tipo",
  "raridade",
  "condicao"
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseQuantidade(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return undefined;
  }

  return value;
}

function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") {
    return value === null ? null : undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}

function getId(request: Request<{ id: string }>): string | undefined {
  const { id } = request.params;
  return Array.isArray(id) ? undefined : id;
}

export async function listarCartas(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const nome = typeof request.query.nome === "string"
      ? request.query.nome.trim()
      : undefined;
    const tipo = typeof request.query.tipo === "string"
      ? request.query.tipo.trim()
      : undefined;
    const raridade = typeof request.query.raridade === "string"
      ? request.query.raridade.trim()
      : undefined;

    const cartas = await prisma.carta.findMany({
      where: {
        usuarioId: request.usuarioId,
        ...(nome ? { nome: { contains: nome, mode: "insensitive" } } : {}),
        ...(tipo ? { tipo } : {}),
        ...(raridade ? { raridade } : {})
      },
      orderBy: { criadoEm: "desc" }
    });

    response.json(cartas);
  } catch (error) {
    next(error);
  }
}

export async function obterResumo(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const where = { usuarioId: request.usuarioId };
    const [quantidades, totalUnicas, valores] = await prisma.$transaction([
      prisma.carta.aggregate({ where, _sum: { quantidade: true } }),
      prisma.carta.count({ where }),
      prisma.carta.aggregate({ where, _sum: { valorEstimado: true } })
    ]);

    response.json({
      totalCartasFisicas: quantidades._sum.quantidade ?? 0,
      totalCartasUnicas: totalUnicas,
      valorTotalEstimado: valores._sum.valorEstimado ?? 0
    });
  } catch (error) {
    next(error);
  }
}

export async function buscarCarta(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction
) {
  try {
    const id = getId(request);
    if (!id) {
      response.status(400).json({ mensagem: "Identificador de carta inválido." });
      return;
    }

    const carta = await prisma.carta.findFirst({
      where: { id, usuarioId: request.usuarioId }
    });

    if (!carta) {
      response.status(404).json({ mensagem: "Carta não encontrada." });
      return;
    }

    response.json(carta);
  } catch (error) {
    next(error);
  }
}

export async function criarCarta(
  request: Request<unknown, unknown, CartaBody>,
  response: Response,
  next: NextFunction
) {
  try {
    const body = request.body;
    const camposAusentes = camposObrigatorios.filter(
      (campo) => !isNonEmptyString(body[campo])
    );
    const quantidade = parseQuantidade(body.quantidade ?? 1);
    const valorEstimado = parseOptionalNumber(body.valorEstimado);

    if (camposAusentes.length > 0) {
      response.status(400).json({
        mensagem: `Campos obrigatórios: ${camposAusentes.join(", ")}.`
      });
      return;
    }

    if (quantidade === undefined) {
      response.status(400).json({
        mensagem: "Quantidade deve ser um número inteiro maior ou igual a 1."
      });
      return;
    }

    if (body.valorEstimado !== undefined && valorEstimado === undefined) {
      response.status(400).json({
        mensagem: "Valor estimado deve ser um número maior ou igual a zero."
      });
      return;
    }

    const carta = await prisma.carta.create({
      data: {
        usuarioId: request.usuarioId,
        nome: body.nome as string,
        colecao: body.colecao as string,
        numeroCarta: body.numeroCarta as string,
        tipo: body.tipo as string,
        raridade: body.raridade as string,
        condicao: body.condicao as string,
        quantidade,
        ...(valorEstimado !== undefined ? { valorEstimado } : {}),
        ...(typeof body.urlImagem === "string"
          ? { urlImagem: body.urlImagem.trim() || null }
          : {})
      }
    });

    response.status(201).json(carta);
  } catch (error) {
    next(error);
  }
}

export async function atualizarCarta(
  request: Request<{ id: string }, unknown, CartaBody>,
  response: Response,
  next: NextFunction
) {
  try {
    const id = getId(request);
    if (!id) {
      response.status(400).json({ mensagem: "Identificador de carta inválido." });
      return;
    }

    const body = request.body;
    const data: Prisma.CartaUpdateManyMutationInput = {};
    const camposTexto = [
      "nome",
      "colecao",
      "numeroCarta",
      "tipo",
      "raridade",
      "condicao"
    ] as const;

    for (const campo of camposTexto) {
      if (body[campo] !== undefined) {
        if (!isNonEmptyString(body[campo])) {
          response.status(400).json({
            mensagem: `${campo} deve ser um texto não vazio.`
          });
          return;
        }
        data[campo] = body[campo];
      }
    }

    if (body.quantidade !== undefined) {
      const quantidade = parseQuantidade(body.quantidade);
      if (quantidade === undefined) {
        response.status(400).json({
          mensagem: "Quantidade deve ser um número inteiro maior ou igual a 1."
        });
        return;
      }
      data.quantidade = quantidade;
    }

    if (body.valorEstimado !== undefined) {
      const valorEstimado = parseOptionalNumber(body.valorEstimado);
      if (valorEstimado === undefined) {
        response.status(400).json({
          mensagem: "Valor estimado deve ser um número maior ou igual a zero."
        });
        return;
      }
      data.valorEstimado = valorEstimado;
    }

    if (body.urlImagem !== undefined) {
      if (body.urlImagem !== null && typeof body.urlImagem !== "string") {
        response.status(400).json({ mensagem: "URL da imagem inválida." });
        return;
      }
      data.urlImagem = body.urlImagem === null
        ? null
        : body.urlImagem.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      response.status(400).json({
        mensagem: "Informe ao menos um campo para atualizar."
      });
      return;
    }

    const resultado = await prisma.carta.updateMany({
      where: { id, usuarioId: request.usuarioId },
      data
    });

    if (resultado.count === 0) {
      response.status(404).json({ mensagem: "Carta não encontrada." });
      return;
    }

    const carta = await prisma.carta.findFirst({
      where: { id, usuarioId: request.usuarioId }
    });
    response.json(carta);
  } catch (error) {
    next(error);
  }
}

export async function excluirCarta(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction
) {
  try {
    const id = getId(request);
    if (!id) {
      response.status(400).json({ mensagem: "Identificador de carta inválido." });
      return;
    }

    const resultado = await prisma.carta.deleteMany({
      where: { id, usuarioId: request.usuarioId }
    });

    if (resultado.count === 0) {
      response.status(404).json({ mensagem: "Carta não encontrada." });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
