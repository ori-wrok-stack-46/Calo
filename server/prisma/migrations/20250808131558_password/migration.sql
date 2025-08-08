-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "password_reset_code" TEXT,
ADD COLUMN     "password_reset_expires" TIMESTAMP(3);
