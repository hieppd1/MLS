-- ============================================================
-- Seed data: Book Categories + Sample Books
-- Run after book-commerce-migration.sql
-- ============================================================

\encoding UTF8
SET search_path TO tenant_demo;

-- Categories
INSERT INTO "BookCategories" ("Id","Name","Slug","Description","SortOrder")
VALUES
  ('11111111-0001-0000-0000-000000000001','Ngữ Pháp',        'ngu-phap',       'Sách về ngữ pháp tiếng Việt', 1),
  ('11111111-0001-0000-0000-000000000002','Từ Vựng',         'tu-vung',        'Từ vựng theo chủ đề', 2),
  ('11111111-0001-0000-0000-000000000003','Giao Tiếp',       'giao-tiep',      'Hội thoại và giao tiếp thực tế', 3),
  ('11111111-0001-0000-0000-000000000004','Phát Âm',         'phat-am',        'Luyện phát âm chuẩn', 4),
  ('11111111-0001-0000-0000-000000000005','Luyện Thi',       'luyen-thi',      'Đề thi và luyện tập', 5),
  ('11111111-0001-0000-0000-000000000006','Văn Hóa',         'van-hoa',        'Văn hóa và lịch sử Việt Nam', 6)
ON CONFLICT ("Id") DO NOTHING;

-- Sample Books
INSERT INTO "Books" (
  "Id","Title","Slug","ShortDescription","Author","Publisher",
  "CoverColor","CoverEmoji","Type","CategoryId","Level",
  "Price","DiscountPrice","Status","IsFeatured","SortOrder",
  "Rating","ReviewCount","PurchaseCount","CreatedBy"
)
VALUES
  (
    '22222222-0001-0000-0000-000000000001',
    'Ngữ Pháp Tiếng Việt Cơ Bản A1-A2',
    'ngu-phap-tieng-viet-co-ban-a1-a2-abc001',
    'Giáo trình ngữ pháp toàn diện cho người mới bắt đầu. Bao gồm 50 điểm ngữ pháp quan trọng.',
    'ThS. Nguyễn Thị Lan', 'NXB Giáo Dục',
    '#1a3a5c', '📖', 'Ebook',
    '11111111-0001-0000-0000-000000000001', 'A1',
    149000, 99000, 'Published', true, 1,
    4.8, 124, 892,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0002-0000-0000-000000000001',
    '1000 Từ Vựng Tiếng Việt Thông Dụng',
    '1000-tu-vung-tieng-viet-thong-dung-abc002',
    'Bộ từ vựng 1000 từ thông dụng nhất trong tiếng Việt, kèm ví dụ và hình ảnh minh họa.',
    'PGS. Trần Văn Minh', 'NXB Đại Học Quốc Gia',
    '#2d6a4f', '📝', 'Ebook',
    '11111111-0001-0000-0000-000000000002', 'A2',
    189000, NULL, 'Published', true, 2,
    4.6, 87, 456,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0003-0000-0000-000000000001',
    'Hội Thoại Hàng Ngày B1',
    'hoi-thoai-hang-ngay-b1-abc003',
    'Các mẫu câu và hội thoại thực tế trong cuộc sống hàng ngày. 200 tình huống giao tiếp.',
    'TS. Lê Thị Hương', 'NXB Thế Giới',
    '#7b2d8b', '💬', 'Physical',
    '11111111-0001-0000-0000-000000000003', 'B1',
    249000, 199000, 'Published', false, 3,
    4.9, 203, 1240,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0004-0000-0000-000000000001',
    'Luyện Phát Âm Chuẩn Tiếng Việt',
    'luyen-phat-am-chuan-tieng-viet-abc004',
    'Hướng dẫn phát âm các thanh điệu và phụ âm khó. Kèm file audio luyện tập.',
    'GS. Phạm Thanh Tùng', 'NXB Văn Học',
    '#c44b1c', '🎙️', 'Combo',
    '11111111-0001-0000-0000-000000000004', 'A1',
    329000, 279000, 'Published', true, 4,
    4.7, 156, 678,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0005-0000-0000-000000000001',
    'Đề Thi Năng Lực Tiếng Việt B2',
    'de-thi-nang-luc-tieng-viet-b2-abc005',
    'Bộ đề thi năng lực tiếng Việt cấp độ B2 với 20 đề luyện thi và đáp án chi tiết.',
    'ThS. Vũ Ngọc Anh', 'NXB Đại Học',
    '#1b4f72', '✏️', 'Ebook',
    '11111111-0001-0000-0000-000000000005', 'B2',
    299000, 249000, 'Published', false, 5,
    4.5, 92, 312,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0006-0000-0000-000000000001',
    'Văn Hóa Việt Nam Qua Các Thời Đại',
    'van-hoa-viet-nam-qua-cac-thoi-dai-abc006',
    'Khám phá văn hóa, phong tục tập quán và lịch sử Việt Nam qua các thời đại.',
    'PGS.TS. Hoàng Minh Đức', 'NXB Văn Hóa',
    '#8b4513', '🏛️', 'Physical',
    '11111111-0001-0000-0000-000000000006', NULL,
    199000, NULL, 'Published', false, 6,
    4.4, 45, 189,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0007-0000-0000-000000000001',
    'Tiếng Việt Thương Mại C1',
    'tieng-viet-thuong-mai-c1-abc007',
    'Thuật ngữ và mẫu câu trong môi trường kinh doanh, hội nghị và đàm phán.',
    'TS. Nguyễn Hoài Thu', 'NXB Kinh Tế',
    '#0d3349', '💼', 'Ebook',
    '11111111-0001-0000-0000-000000000003', 'C1',
    389000, 329000, 'Published', true, 7,
    4.9, 78, 234,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0008-0000-0000-000000000001',
    'Truyện Ngắn Tiếng Việt Cho Người Học',
    'truyen-ngan-tieng-viet-cho-nguoi-hoc-abc008',
    'Tuyển tập 30 truyện ngắn Việt Nam được biên soạn dành cho người học ngoại ngữ, kèm chú giải.',
    'Nhiều tác giả', 'NXB Kim Đồng',
    '#4a235a', '📚', 'Combo',
    '11111111-0001-0000-0000-000000000006', 'B1',
    279000, 229000, 'Published', false, 8,
    4.6, 134, 567,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT ("Id") DO NOTHING;
