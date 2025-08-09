/*
  Warnings:

  - You are about to alter the column `target_calories_daily` on the `user_meal_plans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Changed the type of `plan_type` on the `user_meal_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."user_meal_plans" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "feedback_disliked" TEXT,
ADD COLUMN     "feedback_liked" TEXT,
ADD COLUMN     "feedback_suggestions" TEXT,
ADD COLUMN     "rating" INTEGER,
DROP COLUMN "plan_type",
ADD COLUMN     "plan_type" TEXT NOT NULL,
ALTER COLUMN "meals_per_day" DROP DEFAULT,
ALTER COLUMN "fixed_meal_times" SET DEFAULT true,
ALTER COLUMN "target_calories_daily" SET DATA TYPE INTEGER,
ALTER COLUMN "dietary_preferences" SET DATA TYPE TEXT,
ALTER COLUMN "excluded_ingredients" SET DATA TYPE TEXT,
ALTER COLUMN "is_active" SET DEFAULT false,
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3);
