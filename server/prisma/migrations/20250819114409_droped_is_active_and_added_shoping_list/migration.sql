/*
  Warnings:

  - You are about to drop the column `is_active` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the `shopping_lists` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `icon` on table `Achievement` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."shopping_lists" DROP CONSTRAINT "shopping_lists_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shopping_lists" DROP CONSTRAINT "shopping_lists_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Achievement" DROP COLUMN "is_active",
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unlocked_date" TIMESTAMP(3),
ALTER COLUMN "points_awarded" SET DEFAULT 100,
ALTER COLUMN "icon" SET NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'MILESTONE';

-- DropTable
DROP TABLE "public"."shopping_lists";

-- CreateTable
CREATE TABLE "public"."shopping_list" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'pieces',
    "category" TEXT DEFAULT 'Other',
    "is_purchased" BOOLEAN NOT NULL DEFAULT false,
    "added_from" TEXT DEFAULT 'manual',
    "estimated_cost" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_list_user_id_idx" ON "public"."shopping_list"("user_id");

-- AddForeignKey
ALTER TABLE "public"."shopping_list" ADD CONSTRAINT "shopping_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopping_list" ADD CONSTRAINT "shopping_list_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."user_meal_plans"("plan_id") ON DELETE SET NULL ON UPDATE CASCADE;
