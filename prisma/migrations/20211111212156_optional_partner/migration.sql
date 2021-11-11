-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_partner1Id_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "partner1Id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partner1Id_fkey" FOREIGN KEY ("partner1Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
