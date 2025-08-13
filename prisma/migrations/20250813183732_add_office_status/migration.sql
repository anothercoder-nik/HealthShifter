-- CreateTable
CREATE TABLE "public"."OfficeStatus" (
    "id" TEXT NOT NULL DEFAULT 'office',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedBy" TEXT,
    "activatedAt" INTEGER,
    "updatedAt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfficeStatus_pkey" PRIMARY KEY ("id")
);
