/*
  Warnings:

  - You are about to drop the column `responsableId` on the `Equipe` table. All the data in the column will be lost.
  - You are about to drop the column `equipeId` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Equipe" DROP CONSTRAINT "Equipe_responsableId_fkey";

-- DropForeignKey
ALTER TABLE "Utilisateur" DROP CONSTRAINT "Utilisateur_equipeId_fkey";

-- AlterTable
ALTER TABLE "Equipe" DROP COLUMN "responsableId";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "equipeId";

-- CreateTable
CREATE TABLE "_MembresEquipes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MembresEquipes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ResponsablesEquipes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ResponsablesEquipes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MembresEquipes_B_index" ON "_MembresEquipes"("B");

-- CreateIndex
CREATE INDEX "_ResponsablesEquipes_B_index" ON "_ResponsablesEquipes"("B");

-- AddForeignKey
ALTER TABLE "_MembresEquipes" ADD CONSTRAINT "_MembresEquipes_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MembresEquipes" ADD CONSTRAINT "_MembresEquipes_B_fkey" FOREIGN KEY ("B") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponsablesEquipes" ADD CONSTRAINT "_ResponsablesEquipes_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponsablesEquipes" ADD CONSTRAINT "_ResponsablesEquipes_B_fkey" FOREIGN KEY ("B") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
