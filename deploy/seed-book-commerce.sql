-- ============================================================
-- Seed: Book Ecommerce Demo Data (comprehensive)
-- Covers: Orders, OrderItems, Invoices, EbookEntitlements,
--         BookReviews, and Book stat updates
-- Run AFTER: book-commerce-migration, order-migration,
--            phase3-migration, phase4-migration, phase5-migration,
--            seed.sql, seed-books.sql
-- ============================================================

\encoding UTF8
SET client_encoding = 'UTF8';
SET search_path TO tenant_demo, public;

BEGIN;

-- ============================================================
-- 0. USER REFERENCE
-- ============================================================
-- hocvien1: a0000001-0000-0000-0000-000000000004 | Phạm Văn Đức
-- hocvien2: a0000001-0000-0000-0000-000000000005 | Lê Thị Mai
-- hocvien3: a0000001-0000-0000-0000-000000000006 | Hoàng Văn Minh
--
-- BOOK TYPES:
-- Ebook:    22222222-0001 (Ngữ Pháp 99k), 22222222-0002 (1000 Từ 189k),
--           22222222-0005 (Đề Thi 249k), 22222222-0007 (TM 329k)
-- Physical: 22222222-0003 (Hội Thoại 199k), 22222222-0006 (Văn Hóa 199k)
-- Combo:    22222222-0004 (Phát Âm 279k), 22222222-0008 (Truyện Ngắn 229k)
-- ============================================================

-- ============================================================
-- 1. ORDERS (6 orders, all Paid)
-- ============================================================
INSERT INTO "Orders" (
  "Id","OrderCode","UserId","Status",
  "TotalAmount","DiscountAmount","FinalAmount",
  "VoucherCode","PaymentStatus","PaymentMethod",
  "PaymentNote","PaidAt","ShippingJson",
  "CreatedAt","UpdatedAt"
)
VALUES
  -- Order 1: hocvien1 buys Ngữ Pháp (Ebook 99k) + Luyện Phát Âm (Combo 279k)
  (
    'b0000001-0001-0000-0000-000000000001',
    'ORD-2026-0001',
    'a0000001-0000-0000-0000-000000000004',
    'Paid',
    378000, 0, 378000,
    NULL, 'Paid', 'BankTransfer',
    'Thanh toán qua ngân hàng VietcomBank',
    NOW() - INTERVAL '90 days',
    NULL,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  -- Order 2: hocvien2 buys 1000 Từ Vựng (Ebook 189k) + Tiếng Việt TM (Ebook 329k)
  (
    'b0000001-0002-0000-0000-000000000001',
    'ORD-2026-0002',
    'a0000001-0000-0000-0000-000000000005',
    'Paid',
    518000, 0, 518000,
    NULL, 'Paid', 'MoMo',
    'Thanh toán qua ví MoMo',
    NOW() - INTERVAL '75 days',
    NULL,
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '75 days'
  ),
  -- Order 3: hocvien3 buys Hội Thoại (Physical 199k) + Văn Hóa VN (Physical 199k)
  (
    'b0000001-0003-0000-0000-000000000001',
    'ORD-2026-0003',
    'a0000001-0000-0000-0000-000000000006',
    'Paid',
    398000, 0, 398000,
    NULL, 'Paid', 'BankTransfer',
    'Thanh toán qua ngân hàng Techcombank',
    NOW() - INTERVAL '60 days',
    '{"name":"Hoàng Văn Minh","phone":"0901234567","address":"45 Nguyễn Huệ, Quận 1, TP.HCM","note":"Giao giờ hành chính"}',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  -- Order 4: hocvien1 buys Đề Thi B2 (Ebook 249k) + Truyện Ngắn (Combo 229k)
  (
    'b0000001-0004-0000-0000-000000000001',
    'ORD-2026-0004',
    'a0000001-0000-0000-0000-000000000004',
    'Paid',
    478000, 0, 478000,
    NULL, 'Paid', 'ZaloPay',
    'Thanh toán qua ZaloPay',
    NOW() - INTERVAL '45 days',
    NULL,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days'
  ),
  -- Order 5: hocvien2 buys Hội Thoại B1 (Physical 199k)
  (
    'b0000001-0005-0000-0000-000000000001',
    'ORD-2026-0005',
    'a0000001-0000-0000-0000-000000000005',
    'Paid',
    199000, 0, 199000,
    NULL, 'Paid', 'COD',
    'Thanh toán khi nhận hàng',
    NOW() - INTERVAL '30 days',
    '{"name":"Lê Thị Mai","phone":"0987654321","address":"78 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội","note":""}',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  -- Order 6: hocvien3 buys Luyện Phát Âm (Combo 279k) + Truyện Ngắn (Combo 229k)
  (
    'b0000001-0006-0000-0000-000000000001',
    'ORD-2026-0006',
    'a0000001-0000-0000-0000-000000000006',
    'Paid',
    508000, 0, 508000,
    NULL, 'Paid', 'MoMo',
    'Thanh toán qua ví MoMo',
    NOW() - INTERVAL '14 days',
    NULL,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  )
ON CONFLICT ("Id") DO NOTHING;

-- ============================================================
-- 2. ORDER ITEMS (11 items across 6 orders)
-- ============================================================
INSERT INTO "OrderItems" (
  "Id","OrderId",
  "BookId","BookTitle","BookType","BookSlug",
  "BookCoverColor","BookCoverEmoji","BookCoverUrl",
  "Quantity","UnitPrice","TotalPrice",
  "ItemType","CourseId","CourseSlug",
  "CreatedAt","UpdatedAt"
)
VALUES
  -- Order 1, Item 1: Ngữ Pháp Tiếng Việt (Ebook)
  (
    'b0000002-0001-0000-0000-000000000001',
    'b0000001-0001-0000-0000-000000000001',
    '22222222-0001-0000-0000-000000000001',
    'Ngữ Pháp Tiếng Việt Cơ Bản A1-A2',
    'Ebook', 'ngu-phap-tieng-viet-co-ban-a1-a2-abc001',
    '#1a3a5c', '📖', NULL,
    1, 99000, 99000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '90 days', NULL
  ),
  -- Order 1, Item 2: Luyện Phát Âm (Combo)
  (
    'b0000002-0002-0000-0000-000000000001',
    'b0000001-0001-0000-0000-000000000001',
    '22222222-0004-0000-0000-000000000001',
    'Luyện Phát Âm Chuẩn Tiếng Việt',
    'Combo', 'luyen-phat-am-chuan-tieng-viet-abc004',
    '#c44b1c', '🎙️', NULL,
    1, 279000, 279000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '90 days', NULL
  ),
  -- Order 2, Item 1: 1000 Từ Vựng (Ebook)
  (
    'b0000002-0003-0000-0000-000000000001',
    'b0000001-0002-0000-0000-000000000001',
    '22222222-0002-0000-0000-000000000001',
    '1000 Từ Vựng Tiếng Việt Thông Dụng',
    'Ebook', '1000-tu-vung-tieng-viet-thong-dung-abc002',
    '#2d6a4f', '📝', NULL,
    1, 189000, 189000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '75 days', NULL
  ),
  -- Order 2, Item 2: Tiếng Việt Thương Mại (Ebook)
  (
    'b0000002-0004-0000-0000-000000000001',
    'b0000001-0002-0000-0000-000000000001',
    '22222222-0007-0000-0000-000000000001',
    'Tiếng Việt Thương Mại C1',
    'Ebook', 'tieng-viet-thuong-mai-c1-abc007',
    '#0d3349', '💼', NULL,
    1, 329000, 329000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '75 days', NULL
  ),
  -- Order 3, Item 1: Hội Thoại Hàng Ngày (Physical)
  (
    'b0000002-0005-0000-0000-000000000001',
    'b0000001-0003-0000-0000-000000000001',
    '22222222-0003-0000-0000-000000000001',
    'Hội Thoại Hàng Ngày B1',
    'Physical', 'hoi-thoai-hang-ngay-b1-abc003',
    '#7b2d8b', '💬', NULL,
    1, 199000, 199000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '60 days', NULL
  ),
  -- Order 3, Item 2: Văn Hóa Việt Nam (Physical)
  (
    'b0000002-0006-0000-0000-000000000001',
    'b0000001-0003-0000-0000-000000000001',
    '22222222-0006-0000-0000-000000000001',
    'Văn Hóa Việt Nam Qua Các Thời Đại',
    'Physical', 'van-hoa-viet-nam-qua-cac-thoi-dai-abc006',
    '#8b4513', '🏛️', NULL,
    1, 199000, 199000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '60 days', NULL
  ),
  -- Order 4, Item 1: Đề Thi Năng Lực B2 (Ebook)
  (
    'b0000002-0007-0000-0000-000000000001',
    'b0000001-0004-0000-0000-000000000001',
    '22222222-0005-0000-0000-000000000001',
    'Đề Thi Năng Lực Tiếng Việt B2',
    'Ebook', 'de-thi-nang-luc-tieng-viet-b2-abc005',
    '#1b4f72', '✏️', NULL,
    1, 249000, 249000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '45 days', NULL
  ),
  -- Order 4, Item 2: Truyện Ngắn Tiếng Việt (Combo)
  (
    'b0000002-0008-0000-0000-000000000001',
    'b0000001-0004-0000-0000-000000000001',
    '22222222-0008-0000-0000-000000000001',
    'Truyện Ngắn Tiếng Việt Cho Người Học',
    'Combo', 'truyen-ngan-tieng-viet-cho-nguoi-hoc-abc008',
    '#4a235a', '📚', NULL,
    1, 229000, 229000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '45 days', NULL
  ),
  -- Order 5, Item 1: Hội Thoại Hàng Ngày (Physical)
  (
    'b0000002-0009-0000-0000-000000000001',
    'b0000001-0005-0000-0000-000000000001',
    '22222222-0003-0000-0000-000000000001',
    'Hội Thoại Hàng Ngày B1',
    'Physical', 'hoi-thoai-hang-ngay-b1-abc003',
    '#7b2d8b', '💬', NULL,
    1, 199000, 199000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '30 days', NULL
  ),
  -- Order 6, Item 1: Luyện Phát Âm (Combo)
  (
    'b0000002-000a-0000-0000-000000000001',
    'b0000001-0006-0000-0000-000000000001',
    '22222222-0004-0000-0000-000000000001',
    'Luyện Phát Âm Chuẩn Tiếng Việt',
    'Combo', 'luyen-phat-am-chuan-tieng-viet-abc004',
    '#c44b1c', '🎙️', NULL,
    1, 279000, 279000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '14 days', NULL
  ),
  -- Order 6, Item 2: Truyện Ngắn Tiếng Việt (Combo)
  (
    'b0000002-000b-0000-0000-000000000001',
    'b0000001-0006-0000-0000-000000000001',
    '22222222-0008-0000-0000-000000000001',
    'Truyện Ngắn Tiếng Việt Cho Người Học',
    'Combo', 'truyen-ngan-tieng-viet-cho-nguoi-hoc-abc008',
    '#4a235a', '📚', NULL,
    1, 229000, 229000,
    'Book', NULL, NULL,
    NOW() - INTERVAL '14 days', NULL
  )
ON CONFLICT ("Id") DO NOTHING;

-- ============================================================
-- 3. EBOOK ENTITLEMENTS
-- Ebook type: Ngữ Pháp(b1), 1000 Từ(b2), Đề Thi(b5), TM(b7)
-- Combo type: Phát Âm(b4), Truyện Ngắn(b8)
-- hocvien1 bought: b1, b4 (order1); b5, b8 (order4)
-- hocvien2 bought: b2, b7 (order2)
-- hocvien3 bought: b4, b8 (order6)
-- ============================================================
INSERT INTO "EbookEntitlements" (
  "Id","UserId","BookId","Source",
  "ExpiresAt","LastReadAt","ProgressPct",
  "CreatedAt","UpdatedAt"
)
VALUES
  -- hocvien1: Ngữ Pháp (Ebook)
  (
    'b0000003-0001-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    '22222222-0001-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '20 days', 68,
    NOW() - INTERVAL '90 days', NOW() - INTERVAL '20 days'
  ),
  -- hocvien1: Luyện Phát Âm (Combo)
  (
    'b0000003-0002-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    '22222222-0004-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '60 days', 100,
    NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'
  ),
  -- hocvien1: Đề Thi B2 (Ebook)
  (
    'b0000003-0003-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    '22222222-0005-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '10 days', 45,
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days'
  ),
  -- hocvien1: Truyện Ngắn (Combo)
  (
    'b0000003-0004-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    '22222222-0008-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '5 days', 30,
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'
  ),
  -- hocvien2: 1000 Từ Vựng (Ebook)
  (
    'b0000003-0005-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    '22222222-0002-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '40 days', 85,
    NOW() - INTERVAL '75 days', NOW() - INTERVAL '40 days'
  ),
  -- hocvien2: Tiếng Việt Thương Mại (Ebook)
  (
    'b0000003-0006-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    '22222222-0007-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '7 days', 22,
    NOW() - INTERVAL '75 days', NOW() - INTERVAL '7 days'
  ),
  -- hocvien3: Luyện Phát Âm (Combo)
  (
    'b0000003-0007-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    '22222222-0004-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '3 days', 15,
    NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days'
  ),
  -- hocvien3: Truyện Ngắn (Combo)
  (
    'b0000003-0008-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    '22222222-0008-0000-0000-000000000001',
    'Purchase', NULL,
    NOW() - INTERVAL '1 days', 8,
    NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 days'
  )
ON CONFLICT ("UserId","BookId") DO NOTHING;

-- ============================================================
-- 4. INVOICES (one per order)
-- ============================================================
INSERT INTO "Invoices" (
  "Id","OrderId","InvoiceNumber","IssuedAt",
  "BuyerName","BuyerEmail","BuyerPhone","BuyerAddress","BuyerTaxCode",
  "TotalAmount","DiscountAmount","FinalAmount","VatAmount",
  "Notes","PdfUrl","CreatedAt"
)
VALUES
  -- Invoice for Order 1 (hocvien1 / Phạm Văn Đức)
  (
    'b0000004-0001-0000-0000-000000000001',
    'b0000001-0001-0000-0000-000000000001',
    'INV-2026-0001',
    NOW() - INTERVAL '90 days',
    'Phạm Văn Đức', 'hocvien1@demo.local', '0912345678',
    'Hà Nội, Việt Nam', NULL,
    378000, 0, 378000, 0,
    'Mua sách: Ngữ Pháp A1-A2, Luyện Phát Âm', NULL,
    NOW() - INTERVAL '90 days'
  ),
  -- Invoice for Order 2 (hocvien2 / Lê Thị Mai)
  (
    'b0000004-0002-0000-0000-000000000001',
    'b0000001-0002-0000-0000-000000000001',
    'INV-2026-0002',
    NOW() - INTERVAL '75 days',
    'Lê Thị Mai', 'hocvien2@demo.local', '0987654321',
    'Hà Nội, Việt Nam', NULL,
    518000, 0, 518000, 0,
    'Mua sách: 1000 Từ Vựng, Tiếng Việt Thương Mại C1', NULL,
    NOW() - INTERVAL '75 days'
  ),
  -- Invoice for Order 3 (hocvien3 / Hoàng Văn Minh)
  (
    'b0000004-0003-0000-0000-000000000001',
    'b0000001-0003-0000-0000-000000000001',
    'INV-2026-0003',
    NOW() - INTERVAL '60 days',
    'Hoàng Văn Minh', 'hocvien3@demo.local', '0901234567',
    '45 Nguyễn Huệ, Quận 1, TP.HCM', NULL,
    398000, 0, 398000, 0,
    'Mua sách: Hội Thoại B1, Văn Hóa Việt Nam', NULL,
    NOW() - INTERVAL '60 days'
  ),
  -- Invoice for Order 4 (hocvien1 / Phạm Văn Đức)
  (
    'b0000004-0004-0000-0000-000000000001',
    'b0000001-0004-0000-0000-000000000001',
    'INV-2026-0004',
    NOW() - INTERVAL '45 days',
    'Phạm Văn Đức', 'hocvien1@demo.local', '0912345678',
    'Hà Nội, Việt Nam', NULL,
    478000, 0, 478000, 0,
    'Mua sách: Đề Thi B2, Truyện Ngắn Tiếng Việt', NULL,
    NOW() - INTERVAL '45 days'
  ),
  -- Invoice for Order 5 (hocvien2 / Lê Thị Mai)
  (
    'b0000004-0005-0000-0000-000000000001',
    'b0000001-0005-0000-0000-000000000001',
    'INV-2026-0005',
    NOW() - INTERVAL '30 days',
    'Lê Thị Mai', 'hocvien2@demo.local', '0987654321',
    '78 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', NULL,
    199000, 0, 199000, 0,
    'Mua sách: Hội Thoại Hàng Ngày B1 (bản in)', NULL,
    NOW() - INTERVAL '30 days'
  ),
  -- Invoice for Order 6 (hocvien3 / Hoàng Văn Minh)
  (
    'b0000004-0006-0000-0000-000000000001',
    'b0000001-0006-0000-0000-000000000001',
    'INV-2026-0006',
    NOW() - INTERVAL '14 days',
    'Hoàng Văn Minh', 'hocvien3@demo.local', '0901234567',
    'TP.HCM, Việt Nam', NULL,
    508000, 0, 508000, 0,
    'Mua sách: Luyện Phát Âm, Truyện Ngắn Tiếng Việt', NULL,
    NOW() - INTERVAL '14 days'
  )
ON CONFLICT ("OrderId") DO NOTHING;

-- ============================================================
-- 5. BOOK REVIEWS (3 reviews per book = 24 total)
-- IsVerifiedPurchase = true if user actually bought the book
-- ============================================================
INSERT INTO "BookReviews" (
  "Id","BookId","UserId","Rating",
  "Title","Content","IsVerifiedPurchase",
  "CreatedAt","UpdatedAt"
)
VALUES
  -- === Book 1: Ngữ Pháp Tiếng Việt A1-A2 ===
  (
    'b0000005-0001-0000-0000-000000000001',
    '22222222-0001-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    5,
    'Giáo trình tuyệt vời cho người mới bắt đầu',
    'Tôi đã học tiếng Việt được 3 tháng và cuốn sách này thực sự là người bạn đồng hành tuyệt vời. Cách trình bày ngữ pháp rõ ràng, ví dụ phong phú và dễ hiểu. Đặc biệt, phần bài tập cuối mỗi chương giúp tôi ôn luyện rất hiệu quả.',
    true,
    NOW() - INTERVAL '70 days', NULL
  ),
  (
    'b0000005-0002-0000-0000-000000000001',
    '22222222-0001-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    5,
    'Nội dung chi tiết và có hệ thống',
    'Cuốn sách bao gồm đủ 50 điểm ngữ pháp quan trọng từ A1 đến A2, được sắp xếp theo trình tự từ đơn giản đến phức tạp. Tôi đặc biệt thích phần bảng tóm tắt ở cuối sách để ôn tập nhanh.',
    false,
    NOW() - INTERVAL '50 days', NULL
  ),
  (
    'b0000005-0003-0000-0000-000000000001',
    '22222222-0001-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    4,
    'Tốt nhưng cần thêm ví dụ thực tế',
    'Sách có nội dung khá đầy đủ và trình bày đẹp. Tuy nhiên tôi mong muốn có thêm nhiều ví dụ từ giao tiếp hàng ngày hơn là các câu mẫu học thuật. Dù sao đây vẫn là một tài liệu học rất đáng đồng tiền.',
    false,
    NOW() - INTERVAL '30 days', NULL
  ),

  -- === Book 2: 1000 Từ Vựng Tiếng Việt Thông Dụng ===
  (
    'b0000005-0004-0000-0000-000000000001',
    '22222222-0002-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    5,
    'Bộ từ vựng rất thực dụng trong cuộc sống',
    'Sau khi học xong 1000 từ trong cuốn này, tôi có thể giao tiếp cơ bản được trong hầu hết tình huống hàng ngày. Hình ảnh minh họa sinh động giúp tôi nhớ từ nhanh hơn nhiều so với học thuần túy qua văn bản.',
    true,
    NOW() - INTERVAL '55 days', NULL
  ),
  (
    'b0000005-0005-0000-0000-000000000001',
    '22222222-0002-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    4,
    'Phong phú và có tổ chức tốt theo chủ đề',
    'Từ vựng được chia theo 20 chủ đề khác nhau rất hợp lý. Tôi thường đọc một chủ đề mỗi ngày và luyện tập theo flashcard. Sẽ tốt hơn nếu có phần phát âm audio kèm theo.',
    false,
    NOW() - INTERVAL '40 days', NULL
  ),
  (
    'b0000005-0006-0000-0000-000000000001',
    '22222222-0002-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Mua lần 2 vì quá hay',
    'Tôi đã giới thiệu cho nhiều bạn học tiếng Việt cùng nhóm. Các từ được chọn lọc rất thực tế, không có những từ cổ hoặc ít dùng. Ví dụ trong câu tự nhiên và sinh động.',
    true,
    NOW() - INTERVAL '20 days', NULL
  ),

  -- === Book 3: Hội Thoại Hàng Ngày B1 ===
  (
    'b0000005-0007-0000-0000-000000000001',
    '22222222-0003-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    5,
    'Giúp tôi tự tin giao tiếp thực tế',
    '200 tình huống trong sách bao phủ hầu như mọi hoàn cảnh trong cuộc sống: từ mua sắm, đi ăn nhà hàng đến xin việc làm và đi khám bệnh. Sau 2 tháng học theo sách này, tôi có thể nói chuyện thoải mái với người bản ngữ.',
    true,
    NOW() - INTERVAL '25 days', NULL
  ),
  (
    'b0000005-0008-0000-0000-000000000001',
    '22222222-0003-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Bản in chất lượng cao, nội dung xuất sắc',
    'Sách in trên giấy couché dày dặn, hình ảnh minh họa sắc nét. Nội dung hội thoại tự nhiên, không gượng gạo như một số sách khác tôi đã đọc. Giá cả hợp lý so với chất lượng.',
    true,
    NOW() - INTERVAL '55 days', NULL
  ),
  (
    'b0000005-0009-0000-0000-000000000001',
    '22222222-0003-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    5,
    'Đánh giá từ người học trung cấp',
    'Dù ở trình độ B1 nhưng sách vẫn mang lại nhiều giá trị với tôi - đặc biệt là phần ngữ điệu và các câu nói tắt thông dụng. Khuyên mọi người nên kết hợp với luyện nghe để đạt hiệu quả tốt nhất.',
    false,
    NOW() - INTERVAL '15 days', NULL
  ),

  -- === Book 4: Luyện Phát Âm Chuẩn Tiếng Việt ===
  (
    'b0000005-000a-0000-0000-000000000001',
    '22222222-0004-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    5,
    'Cuối cùng tôi đã nói đúng thanh điệu!',
    'Thanh điệu tiếng Việt là thách thức lớn nhất với tôi. Cuốn sách này giải thích cực kỳ chi tiết cách tạo ra từng thanh, kèm theo file audio để so sánh. Sau 1 tháng luyện theo sách, người Việt đã hiểu tôi nói mà không cần hỏi lại.',
    true,
    NOW() - INTERVAL '65 days', NULL
  ),
  (
    'b0000005-000b-0000-0000-000000000001',
    '22222222-0004-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Combo sách + audio rất xứng đáng',
    'Phần sách giải thích lý thuyết rõ ràng với hình minh họa khẩu hình miệng khi phát âm. Phần audio giọng chuẩn và tốc độ phù hợp để luyện tập. Tôi đặc biệt thích phần luyện các từ dễ nhầm lẫn.',
    true,
    NOW() - INTERVAL '10 days', NULL
  ),
  (
    'b0000005-000c-0000-0000-000000000001',
    '22222222-0004-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    4,
    'Tốt cho người mới bắt đầu học phát âm',
    'Nội dung chi tiết và có hệ thống. Tuy nhiên, với người đã học được một thời gian như tôi, một số phần cơ bản hơi nhiều. Vẫn là tài liệu tham khảo tốt để tra cứu khi cần.',
    false,
    NOW() - INTERVAL '35 days', NULL
  ),

  -- === Book 5: Đề Thi Năng Lực Tiếng Việt B2 ===
  (
    'b0000005-000d-0000-0000-000000000001',
    '22222222-0005-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    5,
    'Luyện thi hiệu quả - tôi đã đậu B2!',
    'Sau khi hoàn thành 20 đề trong sách và xem kỹ đáp án chi tiết, tôi đã vượt qua kỳ thi năng lực B2 với điểm số cao. Cấu trúc đề thi rất sát với đề thi thật. Phần giải thích đáp án giúp tôi hiểu sâu hơn thay vì chỉ học vẹt.',
    true,
    NOW() - INTERVAL '30 days', NULL
  ),
  (
    'b0000005-000e-0000-0000-000000000001',
    '22222222-0005-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    4,
    'Bộ đề hay nhưng cần thêm đề mới',
    'Các đề thi trong sách khá sát thực tế và đáp án rất chi tiết. Tuy nhiên tôi mong có phiên bản cập nhật với các đề thi từ năm 2024-2025 vì đề thi đang thay đổi một số định dạng.',
    false,
    NOW() - INTERVAL '20 days', NULL
  ),
  (
    'b0000005-000f-0000-0000-000000000001',
    '22222222-0005-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Tài liệu không thể thiếu khi thi B2',
    'Tôi đã thử nhiều sách luyện thi khác nhau nhưng cuốn này là đầy đủ và thực tế nhất. Đặc biệt là phần phân tích từng kỹ năng riêng (đọc, nghe, viết, nói) rất hữu ích để biết mình cần cải thiện phần nào.',
    false,
    NOW() - INTERVAL '5 days', NULL
  ),

  -- === Book 6: Văn Hóa Việt Nam Qua Các Thời Đại ===
  (
    'b0000005-0010-0000-0000-000000000001',
    '22222222-0006-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Hiểu người Việt hơn qua cuốn sách này',
    'Học ngôn ngữ mà không hiểu văn hóa thì học chỉ được nửa. Cuốn sách này giải thích rất hay về các phong tục, lễ hội và giá trị văn hóa Việt Nam. Sau khi đọc tôi giao tiếp với người Việt tự nhiên và thân thiện hơn nhiều.',
    true,
    NOW() - INTERVAL '50 days', NULL
  ),
  (
    'b0000005-0011-0000-0000-000000000001',
    '22222222-0006-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    4,
    'Góc nhìn thú vị về lịch sử và văn hóa',
    'Sách được viết theo lối kể chuyện dễ đọc, không khô khan như sách giáo khoa. Tôi đặc biệt thích chương về ẩm thực và âm nhạc dân gian. Ảnh minh họa đẹp và in rõ nét.',
    false,
    NOW() - INTERVAL '25 days', NULL
  ),
  (
    'b0000005-0012-0000-0000-000000000001',
    '22222222-0006-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    4,
    'Kiến thức văn hóa phong phú',
    'Đây là cuốn sách tôi đọc trước khi đi du lịch Việt Nam lần đầu. Nó giúp tôi hiểu nhiều phong tục mà nếu không biết có thể vô tình gây hiểu lầm. Rất nên đọc cho bất kỳ ai muốn tìm hiểu về Việt Nam.',
    false,
    NOW() - INTERVAL '15 days', NULL
  ),

  -- === Book 7: Tiếng Việt Thương Mại C1 ===
  (
    'b0000005-0013-0000-0000-000000000001',
    '22222222-0007-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    5,
    'Cần thiết cho công việc kinh doanh ở Việt Nam',
    'Tôi đang làm việc với đối tác Việt Nam và cuốn sách này đã giúp tôi rất nhiều trong các cuộc họp và đàm phán. Các mẫu câu trong hội nghị, email doanh nghiệp và hợp đồng được trình bày chuyên nghiệp và thực tế.',
    true,
    NOW() - INTERVAL '60 days', NULL
  ),
  (
    'b0000005-0014-0000-0000-000000000001',
    '22222222-0007-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    5,
    'Tiếng Việt thương mại chuyên nghiệp nhất',
    'Từ vựng chuyên ngành được giải thích rõ ràng với ví dụ thực tế từ môi trường kinh doanh Việt Nam. Sách có phần so sánh văn phong trang trọng và thông thường rất hữu ích. Đây là tài liệu tham khảo tôi dùng thường xuyên.',
    false,
    NOW() - INTERVAL '35 days', NULL
  ),
  (
    'b0000005-0015-0000-0000-000000000001',
    '22222222-0007-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Đầu tư xứng đáng cho sự nghiệp',
    'Giá sách có thể cao hơn một chút so với các sách khác nhưng chất lượng nội dung hoàn toàn xứng đáng. Chỉ cần áp dụng được 20% những gì học trong sách là đã hoàn vốn nhiều lần rồi.',
    false,
    NOW() - INTERVAL '8 days', NULL
  ),

  -- === Book 8: Truyện Ngắn Tiếng Việt Cho Người Học ===
  (
    'b0000005-0016-0000-0000-000000000001',
    '22222222-0008-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    5,
    'Cách học tiếng Việt thú vị nhất!',
    'Thay vì học qua bài tập khô cứng, tôi được đọc 30 câu truyện ngắn thực sự hấp dẫn của các nhà văn Việt Nam nổi tiếng. Phần chú giải từ mới và giải thích văn hóa giúp tôi vừa cải thiện ngôn ngữ vừa hiểu sâu hơn về con người Việt.',
    true,
    NOW() - INTERVAL '30 days', NULL
  ),
  (
    'b0000005-0017-0000-0000-000000000001',
    '22222222-0008-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    5,
    'Tuyệt vời cho trình độ trung cấp',
    'Các câu chuyện được chọn lọc rất phù hợp với trình độ B1 - không quá khó nhưng vẫn đủ thách thức để học thêm từ mới. Combo sách in + bản ebook rất tiện lợi để đọc mọi lúc mọi nơi.',
    true,
    NOW() - INTERVAL '10 days', NULL
  ),
  (
    'b0000005-0018-0000-0000-000000000001',
    '22222222-0008-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    4,
    'Hay nhưng cần thêm truyện hiện đại',
    'Hầu hết các truyện đều từ các tác giả cổ điển, tôi mong có thêm truyện từ các tác giả đương đại để phản ánh tiếng Việt hiện đại hơn. Dù vậy, đây vẫn là tài liệu đọc hiểu rất có giá trị.',
    false,
    NOW() - INTERVAL '5 days', NULL
  )
ON CONFLICT ("BookId","UserId") DO NOTHING;

-- ============================================================
-- 6. UPDATE BOOK STATISTICS
-- Formula: weighted average to include new 3 reviews
-- PurchaseCount: add actual purchases from above orders
-- ============================================================

-- Book 1: Ngữ Pháp (purchased by: hocvien1 x1; reviews: 5,5,4)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 5 + 4) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 1
WHERE "Id" = '22222222-0001-0000-0000-000000000001';

-- Book 2: 1000 Từ Vựng (purchased by: hocvien2 x1; reviews: 5,4,5)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 4 + 5) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 1
WHERE "Id" = '22222222-0002-0000-0000-000000000001';

-- Book 3: Hội Thoại (purchased by: hocvien2 + hocvien3 = 2; reviews: 5,5,5)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 5 + 5) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 2
WHERE "Id" = '22222222-0003-0000-0000-000000000001';

-- Book 4: Luyện Phát Âm (purchased by: hocvien1 + hocvien3 = 2; reviews: 5,5,4)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 5 + 4) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 2
WHERE "Id" = '22222222-0004-0000-0000-000000000001';

-- Book 5: Đề Thi B2 (purchased by: hocvien1 x1; reviews: 5,4,5)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 4 + 5) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 1
WHERE "Id" = '22222222-0005-0000-0000-000000000001';

-- Book 6: Văn Hóa VN (purchased by: hocvien3 x1; reviews: 5,4,4)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 4 + 4) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 1
WHERE "Id" = '22222222-0006-0000-0000-000000000001';

-- Book 7: Tiếng Việt TM (purchased by: hocvien2 x1; reviews: 5,5,5)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 5 + 5) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 1
WHERE "Id" = '22222222-0007-0000-0000-000000000001';

-- Book 8: Truyện Ngắn (purchased by: hocvien1 + hocvien3 = 2; reviews: 5,5,4)
UPDATE "Books" SET
  "Rating"        = ROUND(("Rating" * "ReviewCount" + 5 + 5 + 4) / ("ReviewCount" + 3)::NUMERIC, 1),
  "ReviewCount"   = "ReviewCount" + 3,
  "PurchaseCount" = "PurchaseCount" + 2
WHERE "Id" = '22222222-0008-0000-0000-000000000001';

COMMIT;

-- ============================================================
-- Verification
-- ============================================================
SET search_path TO tenant_demo, public;
SELECT 'Orders'            AS tbl, COUNT(*) AS cnt FROM "Orders"
UNION ALL
SELECT 'OrderItems'        AS tbl, COUNT(*) AS cnt FROM "OrderItems"
UNION ALL
SELECT 'Invoices'          AS tbl, COUNT(*) AS cnt FROM "Invoices"
UNION ALL
SELECT 'EbookEntitlements' AS tbl, COUNT(*) AS cnt FROM "EbookEntitlements"
UNION ALL
SELECT 'BookReviews'       AS tbl, COUNT(*) AS cnt FROM "BookReviews"
UNION ALL
SELECT 'Books (total)'     AS tbl, COUNT(*) AS cnt FROM "Books";

SELECT 'Seed completed successfully' AS result;
