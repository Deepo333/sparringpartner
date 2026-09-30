-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Activity" AS ENUM ('DEBATE', 'LEARN', 'REFLECT', 'CHANGE_MY_MIND');

-- CreateEnum
CREATE TYPE "AiRoleType" AS ENUM ('OPPONENT', 'TEACHER', 'COACH', 'SOCRATIC_GUIDE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('VERY_SIMPLE', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "ConfrontationLevel" AS ENUM ('FRIENDLY', 'CHALLENGING', 'COMBATIVE');

-- CreateEnum
CREATE TYPE "ConversationStyle" AS ENUM ('STRUCTURED', 'NATURAL', 'CASUAL');

-- CreateEnum
CREATE TYPE "Interruptibility" AS ENUM ('STRICT_TURNS', 'CONVERSATIONAL', 'FULLY_INTERRUPTIBLE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "Speaker" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('VOICE', 'VOICE_EDITED', 'TEXT');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "configVersion" INTEGER NOT NULL DEFAULT 1,
    "activity" "Activity" NOT NULL,
    "topic" TEXT NOT NULL,
    "userPosition" TEXT NOT NULL,
    "aiRoleType" "AiRoleType" NOT NULL,
    "aiRole" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "complexity" "Complexity" NOT NULL,
    "confrontationLevel" "ConfrontationLevel" NOT NULL,
    "conversationStyle" "ConversationStyle" NOT NULL,
    "interruptibility" "Interruptibility" NOT NULL,
    "adaptiveDifficulty" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "speaker" "Speaker" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "responseTimeMs" INTEGER,
    "interruptedAi" BOOLEAN,
    "inputMethod" "InputMethod",
    "rawTranscript" TEXT,
    "model" TEXT,
    "stopReason" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,

    CONSTRAINT "Turn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_sessionId_index_key" ON "Turn"("sessionId", "index");

-- AddForeignKey
ALTER TABLE "Turn" ADD CONSTRAINT "Turn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Verbatim transcript guarantee: once a turn is stored, its words and speaker
-- can never be changed. (Deleting a whole session is still allowed.)
CREATE OR REPLACE FUNCTION "turn_text_is_immutable"() RETURNS trigger AS $$
BEGIN
  IF NEW."text" IS DISTINCT FROM OLD."text"
     OR NEW."speaker" IS DISTINCT FROM OLD."speaker"
     OR NEW."index" IS DISTINCT FROM OLD."index" THEN
    RAISE EXCEPTION 'Turn text, speaker and order are immutable (turn %)', OLD."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "turn_text_immutable"
BEFORE UPDATE ON "Turn"
FOR EACH ROW EXECUTE FUNCTION "turn_text_is_immutable"();
