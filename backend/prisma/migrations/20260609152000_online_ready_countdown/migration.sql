ALTER TABLE "Debate"
ADD COLUMN "readyCountdownStartedAt" TIMESTAMP(3);

ALTER TABLE "Participant"
ADD COLUMN "isReady" BOOLEAN NOT NULL DEFAULT false;
