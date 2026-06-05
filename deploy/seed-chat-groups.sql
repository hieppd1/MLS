-- Seed 5 chat groups (2 Public, 3 Private) for tenant_demo
-- Idempotent: deletes existing rows with these well-known UUIDs first.
\encoding UTF8
SET client_encoding = 'UTF8';
SET search_path = tenant_demo;

-- Fixed UUIDs for groups so we can re-run safely
-- Public
\set g1 '''11111111-1111-1111-1111-000000000001'''
\set g2 '''11111111-1111-1111-1111-000000000002'''
-- Private
\set g3 '''11111111-1111-1111-1111-000000000003'''
\set g4 '''11111111-1111-1111-1111-000000000004'''
\set g5 '''11111111-1111-1111-1111-000000000005'''

DELETE FROM "ChatGroupMembers" WHERE "GroupId" IN (
  :g1, :g2, :g3, :g4, :g5
);
DELETE FROM "ChatGroups" WHERE "Id" IN (
  :g1, :g2, :g3, :g4, :g5
);

-- Users (from current DB):
--   teacher01 = ef5eb2b9-c497-4eb1-b9f7-28bcbf409516
--   teacher02 = f9998ee2-c67a-4ec5-a049-73da6c1098e7
--   teacher03 = 1a97e190-4e22-4d00-8c29-9301abaafa3a
--   teacher04 = b0bd59b0-81fa-465e-894f-9e0f26e2881c
--   admin01   = 64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83
--   student   = 3c35647e-672d-4dcb-add7-73fc01e82ca6
--   sudent01  = c6f6b1dc-b9d7-41d1-9c22-dbc548e14753
--   phamhiep  = 8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58

INSERT INTO "ChatGroups"
  ("Id","Name","Description","AvatarUrl","Type","MaxMembers","CurrentMembers","Tags","IsActive","CreatedBy","CreatedAt","UpdatedAt")
VALUES
  (:g1, 'Lớp tiếng Việt sơ cấp A1',
        'Cộng đồng học viên A1: hỏi đáp bài tập, chia sẻ tài liệu, luyện nói hằng tuần.',
        NULL, 'Public', 30, 4, 'so-cap,a1,nguphap', TRUE,
        'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', NOW(), NULL),

  (:g2, 'Góc luyện phát âm',
        'Mỗi ngày 1 bài thu âm, giáo viên góp ý. Mọi cấp độ.',
        NULL, 'Public', 50, 4, 'phat-am,speaking,daily', TRUE,
        'f9998ee2-c67a-4ec5-a049-73da6c1098e7', NOW(), NULL),

  (:g3, 'Nhóm ôn VSTEP B2',
        'Nhóm kín dành cho học viên đăng ký lớp VSTEP B2 tháng 6.',
        NULL, 'Private', 15, 3, 'vstep,b2,thi-cu', TRUE,
        '1a97e190-4e22-4d00-8c29-9301abaafa3a', NOW(), NULL),

  (:g4, 'Câu lạc bộ giáo viên',
        'Trao đổi giáo án, chia sẻ best practice giảng dạy.',
        NULL, 'Private', 20, 5, 'noi-bo,giao-vien', TRUE,
        '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', NOW(), NULL),

  (:g5, 'Mentor 1-1: Sơ cấp',
        'Kèm 1-1 cho học viên mới. Chỉ mentor và học viên được mời.',
        NULL, 'Private', 5, 2, 'mentor,1-1', TRUE,
        'b0bd59b0-81fa-465e-894f-9e0f26e2881c', NOW(), NULL);

-- ----- Members -----
-- Helper: each row needs Id (new uuid), GroupId, UserId, Role, Status, JoinedAt, ApprovedBy, ApprovedAt, LastReadMessageId, CreatedAt, UpdatedAt
INSERT INTO "ChatGroupMembers"
  ("Id","GroupId","UserId","Role","Status","JoinedAt","ApprovedBy","ApprovedAt","LastReadMessageId","CreatedAt","UpdatedAt")
VALUES
  -- Group 1 (Public, owner teacher01)
  (gen_random_uuid(), :g1, 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', 'Owner',     'Approved', NOW(), 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g1, '3c35647e-672d-4dcb-add7-73fc01e82ca6', 'Member',    'Approved', NOW(), 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g1, 'c6f6b1dc-b9d7-41d1-9c22-dbc548e14753', 'Member',    'Approved', NOW(), 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g1, 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', 'Moderator', 'Approved', NOW(), 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', NOW(), NULL, NOW(), NULL),

  -- Group 2 (Public, owner teacher02)
  (gen_random_uuid(), :g2, 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', 'Owner',  'Approved', NOW(), 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g2, 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', 'Member', 'Approved', NOW(), 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g2, '3c35647e-672d-4dcb-add7-73fc01e82ca6', 'Member', 'Approved', NOW(), 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g2, '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58', 'Member', 'Approved', NOW(), 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', NOW(), NULL, NOW(), NULL),

  -- Group 3 (Private, owner teacher03) + 1 pending request
  (gen_random_uuid(), :g3, '1a97e190-4e22-4d00-8c29-9301abaafa3a', 'Owner',  'Approved', NOW(), '1a97e190-4e22-4d00-8c29-9301abaafa3a', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g3, 'b0bd59b0-81fa-465e-894f-9e0f26e2881c', 'Member', 'Approved', NOW(), '1a97e190-4e22-4d00-8c29-9301abaafa3a', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g3, '3c35647e-672d-4dcb-add7-73fc01e82ca6', 'Member', 'Approved', NOW(), '1a97e190-4e22-4d00-8c29-9301abaafa3a', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g3, 'c6f6b1dc-b9d7-41d1-9c22-dbc548e14753', 'Member', 'Pending',  NULL,  NULL, NULL, NULL, NOW(), NULL),

  -- Group 4 (Private, owner admin01) — staff room
  (gen_random_uuid(), :g4, '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', 'Owner',     'Approved', NOW(), '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g4, 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516', 'Moderator', 'Approved', NOW(), '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g4, 'f9998ee2-c67a-4ec5-a049-73da6c1098e7', 'Member',    'Approved', NOW(), '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g4, '1a97e190-4e22-4d00-8c29-9301abaafa3a', 'Member',    'Approved', NOW(), '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g4, 'b0bd59b0-81fa-465e-894f-9e0f26e2881c', 'Member',    'Approved', NOW(), '64a4237a-fe5b-4b0c-b8d7-4a2a224b9f83', NOW(), NULL, NOW(), NULL),

  -- Group 5 (Private, owner teacher04) — 1-1 mentor
  (gen_random_uuid(), :g5, 'b0bd59b0-81fa-465e-894f-9e0f26e2881c', 'Owner',  'Approved', NOW(), 'b0bd59b0-81fa-465e-894f-9e0f26e2881c', NOW(), NULL, NOW(), NULL),
  (gen_random_uuid(), :g5, '3c35647e-672d-4dcb-add7-73fc01e82ca6', 'Member', 'Approved', NOW(), 'b0bd59b0-81fa-465e-894f-9e0f26e2881c', NOW(), NULL, NOW(), NULL);

-- Recompute CurrentMembers for accuracy
UPDATE "ChatGroups" g
SET "CurrentMembers" = (
  SELECT COUNT(*) FROM "ChatGroupMembers" m
  WHERE m."GroupId" = g."Id" AND m."Status" = 'Approved'
)
WHERE g."Id" IN (:g1, :g2, :g3, :g4, :g5);

SELECT "Id","Name","Type","CurrentMembers","MaxMembers" FROM "ChatGroups"
WHERE "Id" IN (:g1, :g2, :g3, :g4, :g5)
ORDER BY "Type", "Name";
