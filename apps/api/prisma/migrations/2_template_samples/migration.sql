-- AlterTable
ALTER TABLE "BookTemplate" ADD COLUMN     "sampleBookId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BookTemplate_sampleBookId_key" ON "BookTemplate"("sampleBookId");

-- AddForeignKey
ALTER TABLE "BookTemplate" ADD CONSTRAINT "BookTemplate_sampleBookId_fkey" FOREIGN KEY ("sampleBookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
