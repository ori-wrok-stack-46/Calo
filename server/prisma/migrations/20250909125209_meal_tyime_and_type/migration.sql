/*
  Warnings:

  - You are about to drop the `ai_recommendation` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'LATE_NIGHT', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."ai_recommendation" DROP CONSTRAINT "ai_recommendation_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Meal" ADD COLUMN     "meal_period" TEXT,
ADD COLUMN     "meal_type" "public"."MealType" DEFAULT 'OTHER';

-- DropTable
DROP TABLE "public"."ai_recommendation";

-- DropEnum
DROP TYPE "public"."PriorityLevel";

-- CreateTable
CREATE TABLE "public"."ai_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "priority_level" TEXT NOT NULL DEFAULT 'medium',
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "based_on" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_recommendations_user_id_date_idx" ON "public"."ai_recommendations"("user_id", "date");

-- CreateIndex
CREATE INDEX "ai_recommendations_date_idx" ON "public"."ai_recommendations"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ai_recommendations_user_id_date_key" ON "public"."ai_recommendations"("user_id", "date");

-- AddForeignKey
ALTER TABLE "public"."ai_recommendations" ADD CONSTRAINT "ai_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
