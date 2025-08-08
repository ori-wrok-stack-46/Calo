-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "best_streak" INTEGER DEFAULT 0,
ADD COLUMN     "current_streak" INTEGER DEFAULT 0,
ADD COLUMN     "last_complete_date" TIMESTAMP(3),
ADD COLUMN     "total_complete_days" INTEGER DEFAULT 0;
