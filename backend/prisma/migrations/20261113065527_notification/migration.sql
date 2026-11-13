/*
  Warnings:

  - You are about to drop the column `details` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to alter the column `action` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(150)` to `VarChar(20)`.

*/
-- DropIndex
DROP INDEX "AuditLog_resourceId_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "details",
ADD COLUMN     "actorEmail" VARCHAR(150),
ADD COLUMN     "requestData" JSONB,
ALTER COLUMN "actorRole" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "action" SET DATA TYPE VARCHAR(20);
