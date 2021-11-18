/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "inviteCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_inviteCode_key" ON "Profile"("inviteCode");
