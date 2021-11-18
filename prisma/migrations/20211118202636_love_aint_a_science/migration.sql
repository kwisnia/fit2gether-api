/*
  Warnings:

  - Added the required column `categoryMultiplier` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "categoryMultiplier" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "duration" INTEGER NOT NULL;
