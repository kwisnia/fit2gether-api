/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "avatarUrl",
ADD COLUMN     "avatarId" INTEGER NOT NULL DEFAULT 1;
