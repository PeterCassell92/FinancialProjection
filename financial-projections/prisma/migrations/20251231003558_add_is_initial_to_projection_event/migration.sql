-- AlterTable
ALTER TABLE "ProjectionEvent" ADD COLUMN     "isInitial" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ProjectionEvent_isInitial_idx" ON "ProjectionEvent"("isInitial");
