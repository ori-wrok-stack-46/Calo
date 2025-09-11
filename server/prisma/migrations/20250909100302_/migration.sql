-- CreateEnum
CREATE TYPE "public"."PriorityLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "public"."ai_recommendation" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "priority_level" "public"."PriorityLevel" NOT NULL DEFAULT 'medium',
    "confidence_score" DECIMAL(3,2) NOT NULL DEFAULT 0.75,
    "based_on" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_date" ON "public"."ai_recommendation"("user_id", "date");

-- CreateIndex
CREATE INDEX "idx_date" ON "public"."ai_recommendation"("date");

-- CreateIndex
CREATE INDEX "idx_priority" ON "public"."ai_recommendation"("priority_level");

-- CreateIndex
CREATE UNIQUE INDEX "ai_recommendation_user_id_date_key" ON "public"."ai_recommendation"("user_id", "date");

-- AddForeignKey
ALTER TABLE "public"."ai_recommendation" ADD CONSTRAINT "ai_recommendation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
