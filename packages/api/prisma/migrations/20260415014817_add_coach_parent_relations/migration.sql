-- CreateTable
CREATE TABLE "CoachClub" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachClub_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoachClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentAthlete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParentAthlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParentAthlete_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachClub_userId_clubId_key" ON "CoachClub"("userId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentAthlete_userId_athleteId_key" ON "ParentAthlete"("userId", "athleteId");
