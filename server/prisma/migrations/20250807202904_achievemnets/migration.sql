/*
  Warnings:

  - You are about to drop the column `requirements` on the `Achievement` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `Achievement` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `Achievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `key` on table `Achievement` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Achievement" DROP COLUMN "requirements",
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rarity" TEXT NOT NULL DEFAULT 'COMMON',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL,
ALTER COLUMN "max_progress" SET DEFAULT 1,
ALTER COLUMN "points_awarded" SET DEFAULT 0,
ALTER COLUMN "key" SET NOT NULL;
