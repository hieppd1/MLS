SET client_encoding = 'UTF8';
SELECT la."Id", la."SegmentId", la."Type", la."Title", la."StartTime", la."OrderIndex",
  LEFT(la."Metadata"::text, 60) as metadata_preview
FROM tenant_demo."LearningAssets" la
JOIN tenant_demo."Segments" seg ON seg."Id" = la."SegmentId"
WHERE seg."SessionId" IN (
  '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92',
  'a2000001-0000-0000-0000-000000000001',
  'b25ba2cb-3d07-4ff8-93ec-b8d12b5d1095'
)
ORDER BY la."SegmentId", la."OrderIndex";
