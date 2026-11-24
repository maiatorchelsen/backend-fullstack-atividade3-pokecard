-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- Move as cartas existentes para um usuário de importação
INSERT INTO "Usuario" ("id", "nome", "email", "senhaHash", "criadoEm")
VALUES ('00000000-0000-4000-8000-000000000001', 'Importação', 'importacao@pokemon.local', '$2b$10$jAiiOFxgvdDJPnPU.DRhUeaWdSiHn8MYwQTABtWhxLGY522FOj0va', CURRENT_TIMESTAMP);

-- DropIndex
DROP INDEX "Carta_colecao_numeroCarta_key";

-- AlterTable
ALTER TABLE "Carta" ADD COLUMN "usuarioId" UUID;

-- Backfill
UPDATE "Carta" SET "usuarioId" = '00000000-0000-4000-8000-000000000001' WHERE "usuarioId" IS NULL;

-- AlterTable
ALTER TABLE "Carta" ALTER COLUMN "usuarioId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Carta_usuarioId_idx" ON "Carta"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Carta_usuarioId_colecao_numeroCarta_key" ON "Carta"("usuarioId", "colecao", "numeroCarta");

-- AddForeignKey
ALTER TABLE "Carta" ADD CONSTRAINT "Carta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
