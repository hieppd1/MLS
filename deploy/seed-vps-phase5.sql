-- =============================================================================
-- SEED: Phase 5 — Course Commerce + Invoice Demo Data (VPS)
--
-- Idempotent: all inserts use ON CONFLICT DO NOTHING
-- Run: docker cp /tmp/seed-vps-phase5.sql mls_postgres:/tmp/
--      docker exec mls_postgres psql -U mls_user -d mls -f /tmp/seed-vps-phase5.sql
--
-- Accounts (password: Demo@123456):
--   admin@demo.local    → SuperAdmin
--   giaovien1@demo.local → Teacher
--   giaovien2@demo.local → Teacher
--   hocvien1@demo.local  → Student
--   hocvien2@demo.local  → Student
--   hocvien3@demo.local  → Student
-- =============================================================================

SET client_encoding = 'UTF8';
SET search_path TO tenant_demo, public;

BEGIN;

-- =============================================================================
-- 1. ENSURE COURSES HAVE CORRECT PRICING (idempotent UPDATE)
-- =============================================================================
-- Tiếng Anh Giao Tiếp Cơ Bản
UPDATE "Courses" SET "Price"=499000, "DiscountPrice"=399000, "IsFree"=false WHERE "Id"='d0000001-0000-0000-0000-000000000001';
-- Ngữ Pháp Tiếng Anh
UPDATE "Courses" SET "Price"=699000, "DiscountPrice"=NULL,   "IsFree"=false WHERE "Id"='d0000001-0000-0000-0000-000000000002';
-- IELTS
UPDATE "Courses" SET "Price"=1299000,"DiscountPrice"=999000, "IsFree"=false WHERE "Id"='d0000001-0000-0000-0000-000000000003';
-- Python
UPDATE "Courses" SET "Price"=799000, "DiscountPrice"=599000, "IsFree"=false WHERE "Id"='d0000003-0000-0000-0000-000000000001';
-- Toán
UPDATE "Courses" SET "Price"=399000, "DiscountPrice"=299000, "IsFree"=false WHERE "Id"='d0000003-0000-0000-0000-000000000002';
-- Figma
UPDATE "Courses" SET "Price"=999000, "DiscountPrice"=699000, "IsFree"=false WHERE "Id"='d0000003-0000-0000-0000-000000000003';
-- Thuyết Trình
UPDATE "Courses" SET "Price"=599000, "DiscountPrice"=499000, "IsFree"=false WHERE "Id"='d0000003-0000-0000-0000-000000000004';

-- =============================================================================
-- 2. SAMPLE ORDERS
--
-- Order A: hocvien1 mua Python (599000) + sách Ngữ Pháp (99000)   → Total: 698000
-- Order B: hocvien2 mua Figma (699000) + sách Luyện Phát Âm (279000) → Total: 978000
-- Order C: hocvien3 mua IELTS (999000) + sách Tiếng Việt Thương Mại (329000) → Total: 1328000
-- Order D: hocvien1 mua thêm sách (Hội Thoại 199000 + 1000 Từ Vựng 189000) → Total: 388000
-- Order E: hocvien2 mua Tiếng Anh Giao Tiếp (399000) standalone
-- Order F: hocvien3 mua Toán (299000) standalone
-- =============================================================================

INSERT INTO "Orders" (
  "Id","OrderCode","UserId","TotalAmount","DiscountAmount","FinalAmount",
  "PaymentMethod","PaymentStatus","Status","VoucherCode","Notes",
  "CreatedAt","UpdatedAt","PaidAt"
) VALUES
(
  'ORD00005-0000-0000-0000-000000000001','MLS250521001',
  'a0000001-0000-0000-0000-000000000004',
  698000, 0, 698000,
  'BankTransfer','Paid','Paid',NULL,NULL,
  NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days'
),
(
  'ORD00005-0000-0000-0000-000000000002','MLS250521002',
  'a0000001-0000-0000-0000-000000000005',
  978000, 0, 978000,
  'MoMo','Paid','Paid',NULL,NULL,
  NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days'
),
(
  'ORD00005-0000-0000-0000-000000000003','MLS250521003',
  'a0000001-0000-0000-0000-000000000006',
  1328000, 0, 1328000,
  'VNPay','Paid','Paid',NULL,NULL,
  NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days'
),
(
  'ORD00005-0000-0000-0000-000000000004','MLS250521004',
  'a0000001-0000-0000-0000-000000000004',
  388000, 0, 388000,
  'BankTransfer','Paid','Completed',NULL,NULL,
  NOW()-INTERVAL '10 days', NOW()-INTERVAL '9 days', NOW()-INTERVAL '9 days'
),
(
  'ORD00005-0000-0000-0000-000000000005','MLS250521005',
  'a0000001-0000-0000-0000-000000000005',
  399000, 0, 399000,
  'QRBanking','Paid','Paid',NULL,NULL,
  NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days'
),
(
  'ORD00005-0000-0000-0000-000000000006','MLS250521006',
  'a0000001-0000-0000-0000-000000000006',
  299000, 0, 299000,
  'MoMo','Paid','Paid',NULL,NULL,
  NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day'
)
ON CONFLICT ("Id") DO NOTHING;

-- =============================================================================
-- 3. ORDER ITEMS
-- =============================================================================

-- ── Order A: Python (course) + Ngữ Pháp (book) ───────────────────────────────
INSERT INTO "OrderItems" (
  "Id","OrderId","BookId","BookTitle","BookType","Quantity","UnitPrice","Subtotal",
  "BookSlug","CoverColor","CoverEmoji","CoverUrl",
  "ItemType","CourseId","CourseSlug","CreatedAt"
) VALUES
(
  'ORI00005-0000-0000-0000-000000000001',
  'ORD00005-0000-0000-0000-000000000001',
  NULL,
  'Lập Trình Python Từ Cơ Bản đến Nâng Cao','Course',1,599000,599000,
  NULL,NULL,'🐍','https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
  'Course','d0000003-0000-0000-0000-000000000001','lap-trinh-python-tu-co-ban',
  NOW()-INTERVAL '5 days'
),
(
  'ORI00005-0000-0000-0000-000000000002',
  'ORD00005-0000-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  'Ngữ Pháp Tiếng Việt Cơ Bản A1-A2','Ebook',1,99000,99000,
  'ngu-phap-tieng-viet-co-ban-a1-a2-abc001','#1a3a5c','📖',NULL,
  'Book',NULL,NULL,
  NOW()-INTERVAL '5 days'
)
ON CONFLICT ("Id") DO NOTHING;

-- ── Order B: Figma (course) + Luyện Phát Âm (book combo) ─────────────────────
INSERT INTO "OrderItems" (
  "Id","OrderId","BookId","BookTitle","BookType","Quantity","UnitPrice","Subtotal",
  "BookSlug","CoverColor","CoverEmoji","CoverUrl",
  "ItemType","CourseId","CourseSlug","CreatedAt"
) VALUES
(
  'ORI00005-0000-0000-0000-000000000003',
  'ORD00005-0000-0000-0000-000000000002',
  NULL,
  'Thiết Kế UI/UX với Figma — Từ Wireframe đến Prototype','Course',1,699000,699000,
  NULL,NULL,'🎨','https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
  'Course','d0000003-0000-0000-0000-000000000003','thiet-ke-uiux-voi-figma',
  NOW()-INTERVAL '4 days'
),
(
  'ORI00005-0000-0000-0000-000000000004',
  'ORD00005-0000-0000-0000-000000000002',
  '22222222-0004-0000-0000-000000000001',
  'Luyện Phát Âm Chuẩn Tiếng Việt','Combo',1,279000,279000,
  'luyen-phat-am-chuan-tieng-viet-abc004','#c44b1c','🎙️',NULL,
  'Book',NULL,NULL,
  NOW()-INTERVAL '4 days'
)
ON CONFLICT ("Id") DO NOTHING;

-- ── Order C: IELTS (course) + Tiếng Việt Thương Mại (ebook) ──────────────────
INSERT INTO "OrderItems" (
  "Id","OrderId","BookId","BookTitle","BookType","Quantity","UnitPrice","Subtotal",
  "BookSlug","CoverColor","CoverEmoji","CoverUrl",
  "ItemType","CourseId","CourseSlug","CreatedAt"
) VALUES
(
  'ORI00005-0000-0000-0000-000000000005',
  'ORD00005-0000-0000-0000-000000000003',
  NULL,
  'Luyện Thi IELTS 6.5+','Course',1,999000,999000,
  NULL,NULL,'📝','https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600',
  'Course','d0000001-0000-0000-0000-000000000003','luyen-thi-ielts-6-5',
  NOW()-INTERVAL '3 days'
),
(
  'ORI00005-0000-0000-0000-000000000006',
  'ORD00005-0000-0000-0000-000000000003',
  '22222222-0007-0000-0000-000000000001',
  'Tiếng Việt Thương Mại C1','Ebook',1,329000,329000,
  'tieng-viet-thuong-mai-c1-abc007','#0d3349','💼',NULL,
  'Book',NULL,NULL,
  NOW()-INTERVAL '3 days'
)
ON CONFLICT ("Id") DO NOTHING;

-- ── Order D: sách Hội Thoại + 1000 Từ Vựng ───────────────────────────────────
INSERT INTO "OrderItems" (
  "Id","OrderId","BookId","BookTitle","BookType","Quantity","UnitPrice","Subtotal",
  "BookSlug","CoverColor","CoverEmoji","CoverUrl",
  "ItemType","CourseId","CourseSlug","CreatedAt"
) VALUES
(
  'ORI00005-0000-0000-0000-000000000007',
  'ORD00005-0000-0000-0000-000000000004',
  '22222222-0003-0000-0000-000000000001',
  'Hội Thoại Hàng Ngày B1','Physical',1,199000,199000,
  'hoi-thoai-hang-ngay-b1-abc003','#7b2d8b','💬',NULL,
  'Book',NULL,NULL,
  NOW()-INTERVAL '10 days'
),
(
  'ORI00005-0000-0000-0000-000000000008',
  'ORD00005-0000-0000-0000-000000000004',
  '22222222-0002-0000-0000-000000000001',
  '1000 Từ Vựng Tiếng Việt Thông Dụng','Ebook',1,189000,189000,
  '1000-tu-vung-tieng-viet-thong-dung-abc002','#2d6a4f','📝',NULL,
  'Book',NULL,NULL,
  NOW()-INTERVAL '10 days'
)
ON CONFLICT ("Id") DO NOTHING;

-- ── Order E: Tiếng Anh Giao Tiếp (course only) ───────────────────────────────
INSERT INTO "OrderItems" (
  "Id","OrderId","BookId","BookTitle","BookType","Quantity","UnitPrice","Subtotal",
  "BookSlug","CoverColor","CoverEmoji","CoverUrl",
  "ItemType","CourseId","CourseSlug","CreatedAt"
) VALUES
(
  'ORI00005-0000-0000-0000-000000000009',
  'ORD00005-0000-0000-0000-000000000005',
  NULL,
  'Tiếng Anh Giao Tiếp Cơ Bản','Course',1,399000,399000,
  NULL,NULL,'🗣️','https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600',
  'Course','d0000001-0000-0000-0000-000000000001','tieng-anh-giao-tiep-co-ban',
  NOW()-INTERVAL '2 days'
)
ON CONFLICT ("Id") DO NOTHING;

-- ── Order F: Toán THPT (course only) ─────────────────────────────────────────
INSERT INTO "OrderItems" (
  "Id","OrderId","BookId","BookTitle","BookType","Quantity","UnitPrice","Subtotal",
  "BookSlug","CoverColor","CoverEmoji","CoverUrl",
  "ItemType","CourseId","CourseSlug","CreatedAt"
) VALUES
(
  'ORI00005-0000-0000-0000-00000000000a',
  'ORD00005-0000-0000-0000-000000000006',
  NULL,
  'Toán THPT: Giải Tích Căn Bản','Course',1,299000,299000,
  NULL,NULL,'📐','https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600',
  'Course','d0000003-0000-0000-0000-000000000002','toan-thpt-giai-tich-can-ban',
  NOW()-INTERVAL '1 day'
)
ON CONFLICT ("Id") DO NOTHING;

-- =============================================================================
-- 4. COURSE ENROLLMENTS từ thanh toán (Source='Payment')
--    Kết quả của GrantCourseEnrollmentHandler khi Order được Paid
-- =============================================================================
INSERT INTO "CourseEnrollments" (
  "Id","UserId","CourseId","EnrolledAt","Source","OrderId","CreatedAt"
) VALUES
-- hocvien1 → Python (Order A)
(
  'ENR00005-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000004',
  'd0000003-0000-0000-0000-000000000001',
  NOW()-INTERVAL '5 days','Payment',
  'ORD00005-0000-0000-0000-000000000001',
  NOW()-INTERVAL '5 days'
),
-- hocvien2 → Figma (Order B)
(
  'ENR00005-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000005',
  'd0000003-0000-0000-0000-000000000003',
  NOW()-INTERVAL '4 days','Payment',
  'ORD00005-0000-0000-0000-000000000002',
  NOW()-INTERVAL '4 days'
),
-- hocvien3 → IELTS (Order C)
(
  'ENR00005-0000-0000-0000-000000000003',
  'a0000001-0000-0000-0000-000000000006',
  'd0000001-0000-0000-0000-000000000003',
  NOW()-INTERVAL '3 days','Payment',
  'ORD00005-0000-0000-0000-000000000003',
  NOW()-INTERVAL '3 days'
),
-- hocvien2 → Tiếng Anh Giao Tiếp (Order E)
(
  'ENR00005-0000-0000-0000-000000000004',
  'a0000001-0000-0000-0000-000000000005',
  'd0000001-0000-0000-0000-000000000001',
  NOW()-INTERVAL '2 days','Payment',
  'ORD00005-0000-0000-0000-000000000005',
  NOW()-INTERVAL '2 days'
),
-- hocvien3 → Toán (Order F)
(
  'ENR00005-0000-0000-0000-000000000005',
  'a0000001-0000-0000-0000-000000000006',
  'd0000003-0000-0000-0000-000000000002',
  NOW()-INTERVAL '1 day','Payment',
  'ORD00005-0000-0000-0000-000000000006',
  NOW()-INTERVAL '1 day'
)
ON CONFLICT ("UserId","CourseId") DO NOTHING;

-- =============================================================================
-- 5. EBOOK ENTITLEMENTS (cho các order items là ebook/combo)
-- =============================================================================
INSERT INTO "EbookEntitlements" ("Id","UserId","BookId","OrderItemId","ExpiresAt","CreatedAt")
VALUES
-- hocvien1 → Ngữ Pháp (từ Order A)
(
  'EBK00005-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000004',
  '22222222-0001-0000-0000-000000000001',
  'ORI00005-0000-0000-0000-000000000002',
  NULL, NOW()-INTERVAL '5 days'
),
-- hocvien1 → 1000 Từ Vựng (từ Order D)
(
  'EBK00005-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000004',
  '22222222-0002-0000-0000-000000000001',
  'ORI00005-0000-0000-0000-000000000008',
  NULL, NOW()-INTERVAL '10 days'
),
-- hocvien2 → Luyện Phát Âm combo (từ Order B)
(
  'EBK00005-0000-0000-0000-000000000003',
  'a0000001-0000-0000-0000-000000000005',
  '22222222-0004-0000-0000-000000000001',
  'ORI00005-0000-0000-0000-000000000004',
  NULL, NOW()-INTERVAL '4 days'
),
-- hocvien3 → Tiếng Việt Thương Mại (từ Order C)
(
  'EBK00005-0000-0000-0000-000000000004',
  'a0000001-0000-0000-0000-000000000006',
  '22222222-0007-0000-0000-000000000001',
  'ORI00005-0000-0000-0000-000000000006',
  NULL, NOW()-INTERVAL '3 days'
)
ON CONFLICT ("UserId","BookId") DO NOTHING;

-- =============================================================================
-- 6. INVOICES cho các đơn hàng đã thanh toán
-- =============================================================================
INSERT INTO "Invoices" (
  "Id","OrderId","InvoiceNumber","IssuedAt",
  "BuyerName","BuyerEmail","BuyerPhone","BuyerAddress","BuyerTaxCode",
  "TotalAmount","DiscountAmount","FinalAmount","VatAmount",
  "Notes","PdfUrl","CreatedAt"
) VALUES
-- Invoice cho Order A (hocvien1: Python + Ngữ Pháp)
(
  'INV00005-0000-0000-0000-000000000001',
  'ORD00005-0000-0000-0000-000000000001',
  'INV202505A0001',
  NOW()-INTERVAL '5 days',
  'Phạm Văn Đức','hocvien1@demo.local',NULL,NULL,NULL,
  698000,0,698000,0,
  NULL,NULL,NOW()-INTERVAL '5 days'
),
-- Invoice cho Order B (hocvien2: Figma + Luyện Phát Âm)
(
  'INV00005-0000-0000-0000-000000000002',
  'ORD00005-0000-0000-0000-000000000002',
  'INV202505A0002',
  NOW()-INTERVAL '4 days',
  'Lê Thị Mai','hocvien2@demo.local',NULL,NULL,NULL,
  978000,0,978000,0,
  NULL,NULL,NOW()-INTERVAL '4 days'
),
-- Invoice cho Order C (hocvien3: IELTS + TV Thương Mại)
(
  'INV00005-0000-0000-0000-000000000003',
  'ORD00005-0000-0000-0000-000000000003',
  'INV202505A0003',
  NOW()-INTERVAL '3 days',
  'Hoàng Văn Minh','hocvien3@demo.local',NULL,NULL,NULL,
  1328000,0,1328000,0,
  NULL,NULL,NOW()-INTERVAL '3 days'
),
-- Invoice cho Order D (hocvien1: 2 sách)
(
  'INV00005-0000-0000-0000-000000000004',
  'ORD00005-0000-0000-0000-000000000004',
  'INV202505A0004',
  NOW()-INTERVAL '9 days',
  'Phạm Văn Đức','hocvien1@demo.local',NULL,NULL,NULL,
  388000,0,388000,0,
  NULL,NULL,NOW()-INTERVAL '9 days'
),
-- Invoice cho Order E (hocvien2: Tiếng Anh)
(
  'INV00005-0000-0000-0000-000000000005',
  'ORD00005-0000-0000-0000-000000000005',
  'INV202505A0005',
  NOW()-INTERVAL '2 days',
  'Lê Thị Mai','hocvien2@demo.local',NULL,NULL,NULL,
  399000,0,399000,0,
  NULL,NULL,NOW()-INTERVAL '2 days'
),
-- Invoice cho Order F (hocvien3: Toán)
(
  'INV00005-0000-0000-0000-000000000006',
  'ORD00005-0000-0000-0000-000000000006',
  'INV202505A0006',
  NOW()-INTERVAL '1 day',
  'Hoàng Văn Minh','hocvien3@demo.local',NULL,NULL,NULL,
  299000,0,299000,0,
  NULL,NULL,NOW()-INTERVAL '1 day'
)
ON CONFLICT ("OrderId") DO NOTHING;

-- =============================================================================
-- 7. BOOK REVIEWS (xác nhận mua hàng)
-- =============================================================================
INSERT INTO "BookReviews" (
  "Id","BookId","UserId","Rating","Title","Content","IsVerifiedPurchase","CreatedAt"
) VALUES
-- hocvien1 → Ngữ Pháp Tiếng Việt
(
  gen_random_uuid(),
  '22222222-0001-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000004',
  5,'Sách rất hay, dễ hiểu',
  'Mình học được rất nhiều từ cuốn sách này. Ngữ pháp được trình bày logic, ví dụ thực tế. Recommend cho ai mới bắt đầu!',
  true, NOW()-INTERVAL '4 days'
),
-- hocvien1 → 1000 Từ Vựng
(
  gen_random_uuid(),
  '22222222-0002-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000004',
  4,'Từ vựng phong phú',
  'Bộ từ vựng rất đa dạng và có hình ảnh minh họa đẹp. Học theo chủ đề giúp nhớ lâu hơn.',
  true, NOW()-INTERVAL '8 days'
),
-- hocvien2 → Luyện Phát Âm
(
  gen_random_uuid(),
  '22222222-0004-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000005',
  5,'Cải thiện phát âm rõ rệt',
  'Sau 2 tuần luyện với sách này, bạn bè nhận ra sự khác biệt ngay. Kết hợp sách + audio rất hiệu quả.',
  true, NOW()-INTERVAL '3 days'
),
-- hocvien3 → Tiếng Việt Thương Mại
(
  gen_random_uuid(),
  '22222222-0007-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000006',
  5,'Rất hữu ích cho công việc',
  'Mình dùng cuốn này để học tiếng Việt cho môi trường văn phòng. Các mẫu câu trong sách rất thực tế.',
  true, NOW()-INTERVAL '2 days'
)
ON CONFLICT ("BookId","UserId") DO NOTHING;

-- =============================================================================
-- 8. UPDATE BOOK STATS (PurchaseCount, Rating, ReviewCount)
-- =============================================================================
UPDATE "Books" SET "PurchaseCount"="PurchaseCount"+1, "Rating"=4.8, "ReviewCount"="ReviewCount"+1
  WHERE "Id"='22222222-0001-0000-0000-000000000001';
UPDATE "Books" SET "PurchaseCount"="PurchaseCount"+1, "Rating"=4.6, "ReviewCount"="ReviewCount"+1
  WHERE "Id"='22222222-0002-0000-0000-000000000001';
UPDATE "Books" SET "PurchaseCount"="PurchaseCount"+1, "Rating"=4.9, "ReviewCount"="ReviewCount"+1
  WHERE "Id"='22222222-0004-0000-0000-000000000001';
UPDATE "Books" SET "PurchaseCount"="PurchaseCount"+1, "Rating"=4.9, "ReviewCount"="ReviewCount"+1
  WHERE "Id"='22222222-0007-0000-0000-000000000001';

-- =============================================================================
-- 9. UPDATE COURSE ENROLLMENT COUNTS
-- =============================================================================
UPDATE "Courses" SET "EnrollmentCount"=COALESCE("EnrollmentCount",0)+1
  WHERE "Id" IN (
    'd0000003-0000-0000-0000-000000000001', -- Python (+hocvien1)
    'd0000003-0000-0000-0000-000000000002', -- Toán (+hocvien3)
    'd0000003-0000-0000-0000-000000000003', -- Figma (+hocvien2)
    'd0000001-0000-0000-0000-000000000001', -- Tiếng Anh Giao Tiếp (+hocvien2)
    'd0000001-0000-0000-0000-000000000003'  -- IELTS (+hocvien3)
  );

COMMIT;

SELECT 'Phase 5 seed completed: orders, invoices, enrollments, reviews inserted.' AS result;
