-- CreateTable
CREATE TABLE "Carta" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "colecao" TEXT NOT NULL,
    "numeroCarta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "raridade" TEXT NOT NULL,
    "condicao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valorEstimado" DOUBLE PRECISION,
    "urlImagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Carta_nome_idx" ON "Carta"("nome");

-- CreateIndex
CREATE INDEX "Carta_colecao_idx" ON "Carta"("colecao");

-- CreateIndex
CREATE UNIQUE INDEX "Carta_colecao_numeroCarta_key" ON "Carta"("colecao", "numeroCarta");
