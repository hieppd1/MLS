-- =============================================================
-- Sprint 9-10: Realtime Quiz Migration
-- Creates: RealtimeQuizRooms, RoomParticipants tables
-- =============================================================
SET search_path TO tenant_demo, public;

CREATE TABLE IF NOT EXISTS "RealtimeQuizRooms" (
    "Id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    "QuizId"               UUID        NOT NULL REFERENCES "Quizzes"("Id"),
    "RoomCode"             VARCHAR(10) NOT NULL,
    "HostId"               UUID        NOT NULL,
    "State"                VARCHAR(20) NOT NULL DEFAULT 'Waiting',
    "CurrentQuestionIndex" INT         NOT NULL DEFAULT 0,
    "StartedAt"            TIMESTAMPTZ,
    "EndedAt"              TIMESTAMPTZ,
    "CreatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"            TIMESTAMPTZ,
    CONSTRAINT "PK_RealtimeQuizRooms" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_RealtimeQuizRooms_Code" UNIQUE ("RoomCode")
);

CREATE INDEX IF NOT EXISTS idx_rooms_host   ON "RealtimeQuizRooms"("HostId");
CREATE INDEX IF NOT EXISTS idx_rooms_state  ON "RealtimeQuizRooms"("State");

CREATE TABLE IF NOT EXISTS "RoomParticipants" (
    "Id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "RoomId"      UUID        NOT NULL REFERENCES "RealtimeQuizRooms"("Id") ON DELETE CASCADE,
    "UserId"      UUID        NOT NULL,
    "Score"       INT         NOT NULL DEFAULT 0,
    "Rank"        INT         NOT NULL DEFAULT 0,
    "IsConnected" BOOLEAN     NOT NULL DEFAULT TRUE,
    "JoinedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"   TIMESTAMPTZ,
    CONSTRAINT "PK_RoomParticipants" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_RoomParticipants_RoomUser" UNIQUE ("RoomId", "UserId")
);

CREATE INDEX IF NOT EXISTS idx_room_participants ON "RoomParticipants"("RoomId");

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'tenant_demo'
  AND table_name IN ('RealtimeQuizRooms','RoomParticipants');
