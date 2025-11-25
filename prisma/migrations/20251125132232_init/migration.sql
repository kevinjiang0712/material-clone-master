-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "competitorImagePath" TEXT,
    "productImagePath" TEXT,
    "resultImagePath" TEXT,
    "layoutAnalysis" TEXT,
    "styleAnalysis" TEXT,
    "contentAnalysis" TEXT,
    "generatedPrompt" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
