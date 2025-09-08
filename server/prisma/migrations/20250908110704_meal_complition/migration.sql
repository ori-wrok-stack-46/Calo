-- AlterTable
ALTER TABLE "public"."shopping_list" ALTER COLUMN "estimated_cost" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."user_meal_plans" ADD COLUMN     "meals_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "total_meals" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."meal_completions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "menu_id" TEXT,
    "meal_name" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "completed_date" TIMESTAMP(3) NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein_g" DOUBLE PRECISION,
    "carbs_g" DOUBLE PRECISION,
    "fats_g" DOUBLE PRECISION,
    "rating" INTEGER,
    "notes" TEXT,
    "prep_time_actual" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_completions_user_id_completed_date_idx" ON "public"."meal_completions"("user_id", "completed_date");

-- CreateIndex
CREATE INDEX "meal_completions_plan_id_idx" ON "public"."meal_completions"("plan_id");

-- CreateIndex
CREATE INDEX "meal_completions_menu_id_idx" ON "public"."meal_completions"("menu_id");

-- AddForeignKey
ALTER TABLE "public"."meal_completions" ADD CONSTRAINT "meal_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
