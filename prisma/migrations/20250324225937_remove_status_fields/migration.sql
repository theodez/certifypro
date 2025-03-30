/*
  Warnings:

  - You are about to drop the column `statut_team` on the `Equipe` table. All the data in the column will be lost.
  - You are about to drop the column `statut_formation` on the `Formation` table. All the data in the column will be lost.
  - You are about to drop the column `statut_user` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Equipe" DROP COLUMN "statut_team";

-- AlterTable
ALTER TABLE "Formation" DROP COLUMN "statut_formation";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "statut_user";
