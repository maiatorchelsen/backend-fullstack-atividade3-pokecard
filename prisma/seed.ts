import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const cartas = [
  {
    nome: "Charizard ex",
    colecao: "Obsidian Flames",
    numeroCarta: "125/197",
    tipo: "Fogo",
    raridade: "Double Rare",
    condicao: "Near Mint",
    quantidade: 1,
    valorEstimado: 8.5,
    urlImagem: "https://images.pokemontcg.io/sv3/125.png"
  },
  {
    nome: "Pikachu",
    colecao: "Base Set",
    numeroCarta: "58/102",
    tipo: "Lightning",
    raridade: "Common",
    condicao: "Lightly Played",
    quantidade: 2,
    valorEstimado: 0.75,
    urlImagem: "https://images.pokemontcg.io/base1/58.png"
  },
  {
    nome: "Mew ex",
    colecao: "151",
    numeroCarta: "193/165",
    tipo: "Psychic",
    raridade: "Special Illustration Rare",
    condicao: "Near Mint",
    quantidade: 1,
    valorEstimado: 85,
    urlImagem: "https://images.pokemontcg.io/sv3.5/193.png"
  },
  {
    nome: "Umbreon VMAX",
    colecao: "Evolving Skies",
    numeroCarta: "215/203",
    tipo: "Darkness",
    raridade: "Alternate Art Secret",
    condicao: "Near Mint",
    quantidade: 1,
    valorEstimado: 950,
    urlImagem: "https://images.pokemontcg.io/swsh7/215.png"
  },
  {
    nome: "Pikachu with Grey Felt Hat",
    colecao: "Van Gogh Museum",
    numeroCarta: "085/SM-P",
    tipo: "Lightning",
    raridade: "Promo",
    condicao: "Near Mint",
    quantidade: 1,
    valorEstimado: 35,
    urlImagem: "https://images.pokemontcg.io/svblackstarpromos/SVP085.png"
  }
];

async function main() {
  const email = "demo@pokemon.local";
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nome: "Colecionador Demo",
      email,
      senhaHash: await hash(
        (globalThis as { process?: { env?: { SEED_SENHA?: string } } }).process?.env?.SEED_SENHA ??
          "123456",
        10
      )
    }
  });

  for (const carta of cartas) {
    await prisma.carta.upsert({
      where: {
        usuarioId_colecao_numeroCarta: {
          usuarioId: usuario.id,
          colecao: carta.colecao,
          numeroCarta: carta.numeroCarta
        }
      },
      update: carta,
      create: { ...carta, usuarioId: usuario.id }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Falha ao executar o seed:", error);
    await prisma.$disconnect();
    (globalThis as { process?: { exit?: (code?: number) => never } }).process?.exit?.(1);
  });
