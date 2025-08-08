/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Achievement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Achievement" ADD COLUMN     "key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "public"."Achievement"("key");
