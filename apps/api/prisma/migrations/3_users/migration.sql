-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Book_userId_idx" ON "Book"("userId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: orders placed before emails were asked keep an empty one.
ALTER TABLE "Order" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "locale" TEXT;
ALTER TABLE "Order" ALTER COLUMN "email" DROP DEFAULT;
