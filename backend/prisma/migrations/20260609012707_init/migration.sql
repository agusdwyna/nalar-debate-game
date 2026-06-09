-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalRounds" INTEGER NOT NULL DEFAULT 3,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "aiLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateRound" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "roundType" TEXT NOT NULL,
    "proArgument" TEXT,
    "contraArgument" TEXT,
    "proScore" INTEGER,
    "contraScore" INTEGER,
    "aiFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebateRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateResult" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "winnerSide" TEXT NOT NULL,
    "proTotalScore" INTEGER NOT NULL,
    "contraTotalScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "proStrengths" TEXT NOT NULL,
    "contraStrengths" TEXT NOT NULL,
    "proWeaknesses" TEXT NOT NULL,
    "contraWeaknesses" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Debate_roomCode_key" ON "Debate"("roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "DebateResult_debateId_key" ON "DebateResult"("debateId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateRound" ADD CONSTRAINT "DebateRound_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateResult" ADD CONSTRAINT "DebateResult_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
