-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Book_featured_createdAt_idx" ON "Book"("featured", "createdAt");
