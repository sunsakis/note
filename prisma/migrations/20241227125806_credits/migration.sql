/*
  Warnings:

  - You are about to drop the column `isPremium` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isPremium",
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ArticleRead" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleRead_userId_articleId_key" ON "ArticleRead"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "ArticleRead" ADD CONSTRAINT "ArticleRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRead" ADD CONSTRAINT "ArticleRead_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
