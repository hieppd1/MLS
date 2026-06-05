-- Fix double-encoded UTF-8 characters in placement test questions
-- Common patterns: Â° → °, â€" → —, â€™ → ', â€œ → ", â€ → ", Ã© → é, Ã  → à, etc.

SET search_path TO tenant_demo;
SET client_encoding = 'UTF8';

-- Preview before fixing
SELECT "QuestionId", LEFT("Content", 120) AS preview
FROM "Questions"
WHERE "Content" ~ 'Â|â€|Ã';

-- Fix Questions.Content
UPDATE "Questions"
SET "Content" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    "Content",
    'Â°',   '°'),
    'â€"',  '—'),
    'â€™',  ''''),
    'â€œ',  '"'),
    'â€',   '"'),
    'Ã©',   'é'),
    'Ã ',   'à'),
    'Ã¨',   'è'),
    'Ã´',   'ô'),
    'Ã¢',   'â')
WHERE "Content" ~ 'Â|â€|Ã';

-- Fix QuestionOptions.Content
UPDATE "QuestionOptions"
SET "Content" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    "Content",
    'Â°',   '°'),
    'â€"',  '—'),
    'â€™',  ''''),
    'â€œ',  '"'),
    'â€',   '"'),
    'Ã©',   'é'),
    'Ã ',   'à'),
    'Ã¨',   'è'),
    'Ã´',   'ô'),
    'Ã¢',   'â')
WHERE "Content" ~ 'Â|â€|Ã';

-- Verify: should return 0 rows
SELECT COUNT(*) AS remaining_bad
FROM "Questions"
WHERE "Content" ~ 'Â|â€|Ã';
