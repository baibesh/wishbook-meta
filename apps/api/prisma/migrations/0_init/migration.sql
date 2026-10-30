-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('queued', 'toy', 'story', 'hero', 'pages', 'pdf', 'done', 'failed');

-- CreateEnum
CREATE TYPE "Cover" AS ENUM ('soft', 'hard');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "child" JSONB NOT NULL,
    "language" TEXT NOT NULL,
    "methodology" TEXT NOT NULL DEFAULT 'adventure-quest',
    "theme" TEXT,
    "templateId" TEXT,
    "answers" JSONB,
    "title" TEXT,
    "heroDescription" TEXT,
    "heroResponseId" TEXT,
    "heroImagePath" TEXT,
    "toyName" TEXT,
    "toyPhotoPath" TEXT,
    "toyCutoutPath" TEXT,
    "toyDescription" TEXT,
    "toyImagePath" TEXT,
    "petImagePath" TEXT,
    "pages" JSONB NOT NULL DEFAULT '[]',
    "talkQuestions" JSONB NOT NULL DEFAULT '[]',
    "pdfPath" TEXT,
    "error" TEXT,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clientKey" TEXT NOT NULL,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "books" INTEGER NOT NULL,
    "priceKzt" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cover" "Cover" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "booksKzt" INTEGER NOT NULL,
    "deliveryKzt" INTEGER NOT NULL,
    "totalKzt" INTEGER NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "BookTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "methodology" TEXT NOT NULL,
    "languages" TEXT[],
    "theme" TEXT NOT NULL,
    "plot" JSONB NOT NULL,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "stylePrompt" TEXT,
    "coverUrl" TEXT,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintInterest" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_clientKey_idx" ON "Book"("clientKey");

-- CreateIndex
CREATE INDEX "Book_createdAt_demo_idx" ON "Book"("createdAt", "demo");

-- CreateIndex
CREATE INDEX "Credit_clientKey_idx" ON "Credit"("clientKey");

-- CreateIndex
CREATE INDEX "Order_bookId_idx" ON "Order"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookTemplate_slug_key" ON "BookTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PrintInterest_bookId_key" ON "PrintInterest"("bookId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BookTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintInterest" ADD CONSTRAINT "PrintInterest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

