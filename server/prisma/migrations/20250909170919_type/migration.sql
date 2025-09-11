/*
  Warnings:

  - You are about to drop the column `meal_type` on the `Meal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Meal" DROP COLUMN "meal_type";

-- DropEnum
DROP TYPE "public"."MealType";
