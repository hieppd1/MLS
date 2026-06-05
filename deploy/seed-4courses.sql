-- =============================================================================
-- SEED: 4 khóa học giả lập đa dạng
--   1. Lập Trình Python Từ Cơ Bản  (d0000003-...-001)
--   2. Toán THPT: Giải Tích Căn Bản (d0000003-...-002)
--   3. Thiết Kế UI/UX với Figma     (d0000003-...-003)
--   4. Kỹ Năng Thuyết Trình         (d0000003-...-004)
--
-- Chạy trên server:
--   docker cp /tmp/seed-4courses.sql mls_postgres:/tmp/
--   docker exec mls_postgres psql -U mls_user -d mls -f /tmp/seed-4courses.sql
-- =============================================================================

SET client_encoding = 'UTF8';
SET search_path TO tenant_demo, public;

BEGIN;

-- =============================================================================
-- 1. COURSES (4 khóa)
-- =============================================================================
INSERT INTO "Courses" (
  "Id","Title","Code","Description","ShortDescription","Slug",
  "Level","Language","ThumbnailUrl","Tags","Duration",
  "Status","Visibility","IsFree","CertificateEnabled","CompletionRequired",
  "TeacherId","CreatedBy","PublishedAt","Price","DiscountPrice","CreatedAt"
) VALUES
-- Python
(
  'd0000003-0000-0000-0000-000000000001',
  'Lập Trình Python Từ Cơ Bản đến Nâng Cao',
  'PY101',
  'Khóa học Python dành cho người chưa có kinh nghiệm lập trình. Bắt đầu từ cài đặt môi trường, biến, vòng lặp, hàm, rồi tiến đến lập trình hướng đối tượng và các dự án thực tế. Python là ngôn ngữ dễ học nhất để bắt đầu sự nghiệp lập trình.',
  'Học Python từ số 0 — viết chương trình thực chiến trong 8 tuần',
  'lap-trinh-python-tu-co-ban',
  1, 'VI',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
  'python,lập trình,beginner,coding',
  9000,
  'Published', 'Public', false, true, false,
  'b0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  NOW() - INTERVAL '6 days', 799000, 599000, NOW() - INTERVAL '8 days'
),
-- Toán
(
  'd0000003-0000-0000-0000-000000000002',
  'Toán THPT: Giải Tích Căn Bản',
  'TOAN11',
  'Khóa học giải tích dành cho học sinh THPT lớp 11-12. Bao gồm giới hạn hàm số, đạo hàm và ứng dụng, tích phân. Nội dung bám sát chương trình SGK kết hợp luyện đề thi THPT Quốc Gia.',
  'Nắm vững giải tích THPT — từ lý thuyết đến chinh phục đề thi',
  'toan-thpt-giai-tich-can-ban',
  3, 'VI',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600',
  'toán học,giải tích,THPT,đạo hàm',
  7200,
  'Published', 'Public', false, true, true,
  'b0000001-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000003',
  NOW() - INTERVAL '4 days', 399000, 299000, NOW() - INTERVAL '7 days'
),
-- Figma
(
  'd0000003-0000-0000-0000-000000000003',
  'Thiết Kế UI/UX với Figma — Từ Wireframe đến Prototype',
  'FIGMA01',
  'Học thiết kế giao diện ứng dụng mobile và web với Figma — công cụ thiết kế số 1 hiện nay. Từ nguyên tắc UI/UX cơ bản, Auto Layout, Components, đến xây dựng Design System và bàn giao cho developer.',
  'Trở thành UI/UX Designer với Figma — dự án thực tế từ bài 1',
  'thiet-ke-uiux-voi-figma',
  2, 'VI',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
  'figma,UI/UX,thiết kế,design',
  10800,
  'Published', 'Public', false, true, false,
  'b0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  NOW() - INTERVAL '2 days', 999000, 699000, NOW() - INTERVAL '5 days'
),
-- Thuyết trình
(
  'd0000003-0000-0000-0000-000000000004',
  'Kỹ Năng Thuyết Trình Chuyên Nghiệp',
  'THUYET01',
  'Khóa học thực hành kỹ năng thuyết trình từ cơ bản đến nâng cao. Vượt qua nỗi sợ nói trước đám đông, xây dựng kịch bản thuyết trình mạch lạc, sử dụng ngôn ngữ cơ thể và giọng nói chuyên nghiệp.',
  'Nói tự tin trước đám đông — bộ kỹ năng thiết yếu cho sự nghiệp',
  'ky-nang-thuyet-trinh-chuyen-nghiep',
  2, 'VI',
  'https://images.unsplash.com/photo-1552581234-26160f608093?w=600',
  'thuyết trình,kỹ năng mềm,giao tiếp,soft skills',
  7200,
  'Published', 'Public', false, true, false,
  'b0000001-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000003',
  NOW() - INTERVAL '1 day', 599000, 499000, NOW() - INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2. MODULES (1 module mỗi khóa)
-- =============================================================================
INSERT INTO "CourseModules" (
  "Id","CourseId","LevelId","Title","Description","OrderIndex","IsLocked","CreatedAt"
) VALUES
('e0000003-0000-0000-0000-000000000001','d0000003-0000-0000-0000-000000000001',NULL,
  'Module 1: Nền Tảng Python',
  'Xây dựng vững chắc nền tảng lập trình Python: cú pháp, kiểu dữ liệu, điều kiện và vòng lặp.',
  0, false, NOW()),
('e0000003-0000-0000-0000-000000000002','d0000003-0000-0000-0000-000000000002',NULL,
  'Module 1: Giải Tích Cơ Bản',
  'Giới hạn hàm số, đạo hàm và ứng dụng — nội dung cốt lõi giải tích lớp 11.',
  0, false, NOW()),
('e0000003-0000-0000-0000-000000000003','d0000003-0000-0000-0000-000000000003',NULL,
  'Module 1: Figma Từ Đầu',
  'Làm quen Figma, Auto Layout, Components và hoàn thành dự án UI thực tế.',
  0, false, NOW()),
('e0000003-0000-0000-0000-000000000004','d0000003-0000-0000-0000-000000000004',NULL,
  'Module 1: Kỹ Năng Cốt Lõi',
  'Tâm lý học thuyết trình, xây dựng kịch bản và kỹ thuật trình bày chuyên nghiệp.',
  0, false, NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. SESSIONS (3 sessions × 4 khóa = 12)
-- =============================================================================
INSERT INTO "Sessions" (
  "Id","ModuleId","Title","Description","OrderIndex",
  "IsFreeTrial","PublishStatus","SessionType","DurationSeconds","CreatedAt","UpdatedAt"
) VALUES
-- Python
('f0000004-0000-0000-0000-000000000001','e0000003-0000-0000-0000-000000000001',
  'Bài 1: Giới Thiệu Python & Cài Đặt Môi Trường',
  'Python là gì, ứng dụng thực tế, cài đặt Python 3 và VS Code. Viết và chạy chương trình Hello World đầu tiên.',
  0, true, 'Published', 'Interactive', 2700, NOW(), NOW()),
('f0000004-0000-0000-0000-000000000002','e0000003-0000-0000-0000-000000000001',
  'Bài 2: Biến, Kiểu Dữ Liệu & Các Phép Toán',
  'int, float, str, bool — khai báo và gán biến, toán tử số học/so sánh/logic, nhập liệu từ bàn phím.',
  1, false, 'Published', 'Interactive', 3000, NOW(), NOW()),
('f0000004-0000-0000-0000-000000000003','e0000003-0000-0000-0000-000000000001',
  'Bài 3: Câu Lệnh if/else & Vòng Lặp for/while',
  'Lập trình rẽ nhánh với if/elif/else. Vòng lặp for và while, từ khóa break/continue. Bài tập thực hành tổng hợp.',
  2, false, 'Published', 'Interactive', 3300, NOW(), NOW()),
-- Toán
('f0000004-0000-0000-0000-000000000004','e0000003-0000-0000-0000-000000000002',
  'Bài 1: Giới Hạn Hàm Số & Hàm Liên Tục',
  'Khái niệm giới hạn, 7 dạng vô định, kỹ thuật tính giới hạn. Định nghĩa hàm liên tục và ứng dụng.',
  0, true, 'Published', 'Interactive', 2400, NOW(), NOW()),
('f0000004-0000-0000-0000-000000000005','e0000003-0000-0000-0000-000000000002',
  'Bài 2: Đạo Hàm — Định Nghĩa & Công Thức',
  'Định nghĩa đạo hàm qua giới hạn, bảng đạo hàm cơ bản, quy tắc tính đạo hàm và đạo hàm hàm hợp.',
  1, false, 'Published', 'Interactive', 2700, NOW(), NOW()),
('f0000004-0000-0000-0000-000000000006','e0000003-0000-0000-0000-000000000002',
  'Bài 3: Ứng Dụng Đạo Hàm: Cực Trị & Bảng Biến Thiên',
  'Sự đồng biến/nghịch biến của hàm số, cực trị, lập bảng biến thiên và vẽ đồ thị. Dạng bài thi thường gặp.',
  2, false, 'Published', 'Interactive', 3000, NOW(), NOW()),
-- Figma
('f0000004-0000-0000-0000-000000000007','e0000003-0000-0000-0000-000000000003',
  'Bài 1: Làm Quen Figma — Giao Diện & Công Cụ Cơ Bản',
  'Tổng quan Figma, so sánh với Adobe XD và Sketch. Frame, Layer, Vector tools, Typography và Color Styles.',
  0, true, 'Published', 'Interactive', 2400, NOW(), NOW()),
('f0000004-0000-0000-0000-000000000008','e0000003-0000-0000-0000-000000000003',
  'Bài 2: Auto Layout, Components & Design System',
  'Auto Layout cho responsive design, tạo Components và Variants, xây dựng Design System cơ bản với Spacing/Color/Typography.',
  1, false, 'Published', 'Interactive', 3000, NOW(), NOW()),
('f0000004-0000-0000-0000-000000000009','e0000003-0000-0000-0000-000000000003',
  'Bài 3: Thiết Kế App Mobile Hoàn Chỉnh & Prototype',
  'User flow và wireframe, thiết kế high-fidelity UI, tạo Prototype tương tác và handoff cho developer.',
  2, false, 'Published', 'Interactive', 3600, NOW(), NOW()),
-- Thuyết trình
('f0000004-0000-0000-0000-00000000000a','e0000003-0000-0000-0000-000000000004',
  'Bài 1: Tâm Lý Học Thuyết Trình — Vượt Qua Nỗi Sợ',
  'Tại sao 75% người sợ nói trước đám đông. Khoa học não bộ, kỹ thuật 5-4-3-2-1, luyện tập micro-presentation hàng ngày.',
  0, true, 'Published', 'Interactive', 2100, NOW(), NOW()),
('f0000004-0000-0000-0000-00000000000b','e0000003-0000-0000-0000-000000000004',
  'Bài 2: Kịch Bản & Cấu Trúc Bài Thuyết Trình Hiệu Quả',
  'Cấu trúc vàng Opening-Body-Closing, 5 cách mở đầu thu hút, storytelling và kỹ thuật đặt câu hỏi để giữ sự chú ý.',
  1, false, 'Published', 'Interactive', 2400, NOW(), NOW()),
('f0000004-0000-0000-0000-00000000000c','e0000003-0000-0000-0000-000000000004',
  'Bài 3: Ngôn Ngữ Cơ Thể, Giọng Nói & Thiết Kế Slide',
  'Tư thế, ánh mắt, cử chỉ tay chuyên nghiệp. Điều chỉnh tốc độ và âm lượng giọng nói. Quy tắc 6x6 và visualize data.',
  2, false, 'Published', 'Interactive', 2700, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. SEGMENTS (3 segments × 12 sessions = 36)
-- =============================================================================
INSERT INTO "Segments" (
  "Id","SessionId","Title","Description","StartTime","EndTime","OrderIndex","CreatedAt","UpdatedAt"
) VALUES
-- === Python Bài 1 (2700s) ===
('b4000001-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000001',
  'Python là gì & Tại sao nên học?',
  'Lịch sử Python, ranking TIOBE, ứng dụng: web (Django/FastAPI), data science, AI, automation.',
  0, 600, 0, NOW(), NOW()),
('b4000001-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000001',
  'Cài đặt Python 3 & VS Code',
  'Tải Python 3.12 từ python.org, cài VS Code + extension Python, thiết lập virtual environment.',
  600, 1500, 1, NOW(), NOW()),
('b4000001-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000001',
  'Chương trình Hello World đầu tiên',
  'Viết và chạy script Python, hàm print() và input(), cú pháp comment, chạy file .py từ terminal.',
  1500, 2700, 2, NOW(), NOW()),
-- === Python Bài 2 (3000s) ===
('b4000002-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000002',
  'Biến và các kiểu dữ liệu cơ bản',
  'Khai báo biến, quy tắc đặt tên, 4 kiểu dữ liệu: int, float, str, bool. Hàm type() và isinstance().',
  0, 900, 0, NOW(), NOW()),
('b4000002-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000002',
  'Toán tử số học, so sánh & logic',
  '+,-,*,/,//,%,** | ==,!=,>,< | and,or,not. Thứ tự ưu tiên và biểu thức phức hợp.',
  900, 1800, 1, NOW(), NOW()),
('b4000002-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000002',
  'Nhập liệu & Type Conversion',
  'Hàm input(), ép kiểu int()/float()/str(). f-string để định dạng chuỗi. Bài tập tính BMI.',
  1800, 3000, 2, NOW(), NOW()),
-- === Python Bài 3 (3300s) ===
('b4000003-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000003',
  'Câu lệnh if / elif / else',
  'Cú pháp rẽ nhánh, nested if, toán tử ba ngôi (ternary). Ví dụ: phân loại điểm học sinh.',
  0, 1100, 0, NOW(), NOW()),
('b4000003-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000003',
  'Vòng lặp for & while',
  'for..in..range(), lặp qua chuỗi/list, while với điều kiện, từ khóa break/continue/pass.',
  1100, 2200, 1, NOW(), NOW()),
('b4000003-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000003',
  'Bài tập thực hành tổng hợp',
  'Bài 1: In bảng cửu chương. Bài 2: Đoán số ngẫu nhiên. Bài 3: Kiểm tra số nguyên tố.',
  2200, 3300, 2, NOW(), NOW()),
-- === Toán Bài 1 (2400s) ===
('b4000004-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000004',
  'Khái niệm giới hạn & Ký hiệu',
  'Định nghĩa trực quan giới hạn lim f(x) = L, giới hạn một phía, giới hạn tại vô cực.',
  0, 800, 0, NOW(), NOW()),
('b4000004-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000004',
  '7 Dạng vô định & Kỹ thuật tính giới hạn',
  '0/0, ∞/∞, 0·∞, ∞-∞, 0⁰, ∞⁰, 1^∞. Nhân liên hợp, L''Hôpital (giới thiệu), phân tích nhân tử.',
  800, 1600, 1, NOW(), NOW()),
('b4000004-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000004',
  'Hàm số liên tục & Ứng dụng',
  'Định nghĩa hàm liên tục tại điểm và trên khoảng. Định lý Bolzano — chứng minh phương trình có nghiệm.',
  1600, 2400, 2, NOW(), NOW()),
-- === Toán Bài 2 (2700s) ===
('b4000005-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000005',
  'Định nghĩa đạo hàm & Ý nghĩa hình học',
  'Đạo hàm = giới hạn của tỷ số tăng, hệ số góc tiếp tuyến. Ký hiệu f''(x), dy/dx, Df.',
  0, 900, 0, NOW(), NOW()),
('b4000005-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000005',
  'Bảng đạo hàm cơ bản & Quy tắc tính',
  '(xⁿ)''=nxⁿ⁻¹, (sin x)''=cos x, (eˣ)''=eˣ, (ln x)''=1/x. Quy tắc tổng, hiệu, tích, thương.',
  900, 1800, 1, NOW(), NOW()),
('b4000005-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000005',
  'Đạo hàm hàm hợp (Chain Rule)',
  '[f(g(x))]'' = f''(g(x))·g''(x). Đạo hàm hàm lượng giác hợp, hàm mũ hợp. Bài tập tổng hợp.',
  1800, 2700, 2, NOW(), NOW()),
-- === Toán Bài 3 (3000s) ===
('b4000006-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000006',
  'Đồng biến & Nghịch biến',
  'f''(x)>0 → đồng biến, f''(x)<0 → nghịch biến. Tìm khoảng đồng biến/nghịch biến của đa thức, phân thức.',
  0, 1000, 0, NOW(), NOW()),
('b4000006-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000006',
  'Cực trị hàm số',
  'Điều kiện cần & đủ để có cực trị. Phương pháp 1: dùng f''(x). Phương pháp 2: dùng f''''(x).',
  1000, 2000, 1, NOW(), NOW()),
('b4000006-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000006',
  'Bảng biến thiên & Đồ thị hàm số',
  'Lập bảng biến thiên đầy đủ, xác định chiều biến thiên, cực trị, tiệm cận. Vẽ phác đồ thị nhanh.',
  2000, 3000, 2, NOW(), NOW()),
-- === Figma Bài 1 (2400s) ===
('b4000007-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000007',
  'Tổng quan Figma & So sánh công cụ',
  'Figma vs Adobe XD vs Sketch — ưu điểm cộng tác real-time. Giao diện Figma: Canvas, Layers, Properties.',
  0, 800, 0, NOW(), NOW()),
('b4000007-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000007',
  'Frame, Shapes & Typography',
  'Tạo Frame chuẩn iOS/Android, công cụ vẽ vector (Pen, Boolean), Typography: font, size, line-height, letter-spacing.',
  800, 1600, 1, NOW(), NOW()),
('b4000007-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000007',
  'Color Styles & Grids',
  'Định nghĩa Color Styles tái sử dụng, Local Variables (Figma 2024), thiết lập Grid 8px và Column Grid.',
  1600, 2400, 2, NOW(), NOW()),
-- === Figma Bài 2 (3000s) ===
('b4000008-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000008',
  'Auto Layout — Responsive Design',
  'Tạo Auto Layout (Shift+A), padding, gap, min/max width, fill vs hug vs fixed. Responsive button và card.',
  0, 1000, 0, NOW(), NOW()),
('b4000008-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000008',
  'Components & Variants',
  'Tạo Main Component, Instance, Detach. Variants cho Button: size (sm/md/lg) × state (default/hover/disabled).',
  1000, 2000, 1, NOW(), NOW()),
('b4000008-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000008',
  'Xây dựng Design System cơ bản',
  'Typography scale (12/14/16/20/24px), Spacing scale (4/8/12/16/24/32/48px), Color palette với 50-900 shades.',
  2000, 3000, 2, NOW(), NOW()),
-- === Figma Bài 3 (3600s) ===
('b4000009-0000-0000-0000-000000000001','f0000004-0000-0000-0000-000000000009',
  'User Flow & Wireframe',
  'Phân tích user journey, vẽ user flow diagram trong Figma, wireframe low-fidelity cho app học ngoại ngữ.',
  0, 1200, 0, NOW(), NOW()),
('b4000009-0000-0000-0000-000000000002','f0000004-0000-0000-0000-000000000009',
  'High-Fidelity UI Design',
  'Onboarding screens, Home tab, Course detail, Video player UI. Áp dụng Design System đã xây dựng.',
  1200, 2400, 1, NOW(), NOW()),
('b4000009-0000-0000-0000-000000000003','f0000004-0000-0000-0000-000000000009',
  'Prototype & Developer Handoff',
  'Tạo prototype tương tác click-through, smart animate transition. Inspect panel, Zeplin vs Figma Dev Mode.',
  2400, 3600, 2, NOW(), NOW()),
-- === Thuyết trình Bài 1 (2100s) ===
('b400000a-0000-0000-0000-000000000001','f0000004-0000-0000-0000-00000000000a',
  'Tâm lý học thuyết trình: 75% người sợ?',
  'Glossophobia — sợ nói trước công chúng phổ biến hơn sợ chết. Hiểu não bộ (amygdala hijack) để kiểm soát.',
  0, 700, 0, NOW(), NOW()),
('b400000a-0000-0000-0000-000000000002','f0000004-0000-0000-0000-00000000000a',
  'Kỹ thuật 5-4-3-2-1 & Breathing',
  'Phương pháp Mel Robbins, hít thở cơ hoành 4-7-8, power pose (Amy Cuddy). Tái định nghĩa adrenaline.',
  700, 1400, 1, NOW(), NOW()),
('b400000a-0000-0000-0000-000000000003','f0000004-0000-0000-0000-00000000000a',
  'Luyện tập micro-presentation hàng ngày',
  '2-minute drill: mỗi ngày thuyết trình 2 phút về một chủ đề bất kỳ. Ghi hình và phân tích bản thân.',
  1400, 2100, 2, NOW(), NOW()),
-- === Thuyết trình Bài 2 (2400s) ===
('b400000b-0000-0000-0000-000000000001','f0000004-0000-0000-0000-00000000000b',
  'Cấu trúc Opening-Body-Closing',
  'Hook mạnh 30 giây, nêu rõ mục tiêu và lợi ích cho người nghe, chia Body thành 3 điểm chính, CTA cuối.',
  0, 800, 0, NOW(), NOW()),
('b400000b-0000-0000-0000-000000000002','f0000004-0000-0000-0000-00000000000b',
  '5 Cách mở đầu thu hút',
  'Câu hỏi tư duy, số liệu gây sốc, câu chuyện ngắn, trích dẫn, demo trực tiếp. Ví dụ thực tế từng cách.',
  800, 1600, 1, NOW(), NOW()),
('b400000b-0000-0000-0000-000000000003','f0000004-0000-0000-0000-00000000000b',
  'Storytelling & Giữ sự chú ý',
  'Cấu trúc STAR (Situation-Task-Action-Result), kỹ thuật nhịp điệu (fast/slow), câu hỏi tương tác.',
  1600, 2400, 2, NOW(), NOW()),
-- === Thuyết trình Bài 3 (2700s) ===
('b400000c-0000-0000-0000-000000000001','f0000004-0000-0000-0000-00000000000c',
  'Ngôn ngữ cơ thể chuyên nghiệp',
  'Tư thế đứng mở, vùng comfort zone (50-60cm), ánh mắt 3-5 giây/người, cử chỉ tay chủ động vs thụ động.',
  0, 900, 0, NOW(), NOW()),
('b400000c-0000-0000-0000-000000000002','f0000004-0000-0000-0000-00000000000c',
  'Giọng nói: Tốc độ, Âm lượng & Nhấn giọng',
  'Tốc độ lý tưởng 130-150 từ/phút, kỹ thuật dừng (pause) tạo impact, nhấn trọng âm từ khóa quan trọng.',
  900, 1800, 1, NOW(), NOW()),
('b400000c-0000-0000-0000-000000000003','f0000004-0000-0000-0000-00000000000c',
  'Thiết kế Slide theo quy tắc 6x6',
  'Không quá 6 dòng/slide, không quá 6 chữ/dòng. Hierarchy typography, high-contrast, data visualization.',
  1800, 2700, 2, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5. LEARNING ASSETS (2 per session x 12 sessions = 24)
--    Assets linked to Segments (SegmentId FK). Each session: asset1->seg001, asset2->seg003
-- =============================================================================
SET search_path TO tenant_demo, public;
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES
('2a000001-0000-0000-0000-000000000001','b4000001-0000-0000-0000-000000000001',
  'NoteBlock','Cheatsheet: Cú pháp Python cơ bản','Tổng hợp cú pháp print/input/type và comment',
  0,NULL,0,'{"content":"Python basics: print(x) / input(msg) / type(x) / # comment"}'::jsonb,
  true,NOW(),NOW()),
('2a000001-0000-0000-0000-000000000002','b4000001-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: Python cơ bản Bài 1','3 câu hỏi kiểm tra kiến thức phần giới thiệu',
  0,NULL,1,'{"questions":[{"q":"Python được tạo ra bởi ai?","options":["Guido van Rossum","Linus Torvalds","Bill Gates","Dennis Ritchie"],"answer":0},{"q":"Extension của file Python?","options":[".py",".python",".pt",".pyt"],"answer":0},{"q":"Hàm in ra màn hình?","options":["print()","echo()","console.log()","write()"],"answer":0}]}'::jsonb,
  true,NOW(),NOW()),
('2a000002-0000-0000-0000-000000000001','b4000002-0000-0000-0000-000000000001',
  'NoteBlock','Bảng tóm tắt: Kiểu dữ liệu & Toán tử','int, float, str, bool và các toán tử cơ bản',
  0,NULL,0,'{"content":"int/float/str/bool + operators: +,-,*,/,//,%,** | ==,!=,>,< | and,or,not"}'::jsonb,
  true,NOW(),NOW()),
('2a000002-0000-0000-0000-000000000002','b4000002-0000-0000-0000-000000000003',
  'ExerciseBlock','Bài tập: Tính BMI','Thực hành nhập liệu, type conversion và if/elif/else',
  0,NULL,1,'{"instruction":"Nhập chiều cao(m) và cân nặng(kg), tính BMI, phân loại Gầy/Bình thường/Thừa cân/Béo phì","hint":"Dùng input(), float(), if/elif/else"}'::jsonb,
  true,NOW(),NOW()),
('2a000003-0000-0000-0000-000000000001','b4000003-0000-0000-0000-000000000001',
  'NoteBlock','Cú pháp vòng lặp - Quick Reference','Tổng hợp for, while, break, continue',
  0,NULL,0,'{"content":"for i in range(n): ... | for x in list: ... | while cond: ... | break / continue"}'::jsonb,
  true,NOW(),NOW()),
('2a000003-0000-0000-0000-000000000002','b4000003-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: if/else & Vòng lặp','Kiểm tra nắm vững điều kiện và lặp',
  0,NULL,1,'{"questions":[{"q":"range(3) cho kết quả?","options":["[0,1,2]","[1,2,3]","[0,1,2,3]","[1,2]"],"answer":0},{"q":"Thoát vòng lặp ngay lập tức?","options":["break","continue","exit","stop"],"answer":0}]}'::jsonb,
  true,NOW(),NOW()),
('2a000004-0000-0000-0000-000000000001','b4000004-0000-0000-0000-000000000001',
  'NoteBlock','Công thức giới hạn thường gặp','Giới hạn đặc biệt và 7 dạng vô định',
  0,NULL,0,'{"content":"lim(sinx/x)=1 | lim(1+1/n)^n=e | 7 dạng vô định: 0/0, inf/inf, 0*inf, inf-inf, 1^inf, 0^0, inf^0"}'::jsonb,
  true,NOW(),NOW()),
('2a000004-0000-0000-0000-000000000002','b4000004-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: Giới hạn hàm số','Kiểm tra khái niệm và tính giới hạn cơ bản',
  0,NULL,1,'{"questions":[{"q":"lim(x2-1)/(x-1) khi x->1?","options":["2","1","0","Không xác định"],"answer":0},{"q":"f liên tục tại x0 nếu?","options":["lim f(x)=f(x0) và f(x0) tồn tại","Chỉ cần f(x0) tồn tại","lim tồn tại","f đơn điệu"],"answer":0}]}'::jsonb,
  true,NOW(),NOW()),
('2a000005-0000-0000-0000-000000000001','b4000005-0000-0000-0000-000000000001',
  'NoteBlock','Bảng đạo hàm cơ bản','Đạo hàm các hàm thông dụng',
  0,NULL,0,'{"content":"c->0 | x^n->nx^(n-1) | sinx->cosx | cosx->-sinx | e^x->e^x | lnx->1/x | sqrt(x)->1/(2sqrt(x))"}'::jsonb,
  true,NOW(),NOW()),
('2a000005-0000-0000-0000-000000000002','b4000005-0000-0000-0000-000000000003',
  'ExerciseBlock','Bài tập: Tính đạo hàm','Thực hành chain rule và quy tắc tích/thương',
  0,NULL,1,'{"instruction":"Tính đạo hàm: 1) 3x^4-2x^2+5x-1  2) sin(2x)+cos(x^2)  3) e^x*lnx","hint":"Bài 2-3 dùng chain rule: [f(g(x))]=(f(g(x)))*(g(x))"}'::jsonb,
  true,NOW(),NOW()),
('2a000006-0000-0000-0000-000000000001','b4000006-0000-0000-0000-000000000001',
  'NoteBlock','Quy trình lập bảng biến thiên','6 bước chuẩn để lập bảng biến thiên',
  0,NULL,0,'{"content":"1.Tập xác định  2.Tính f(x)  3.Giải f(x)=0 xét dấu  4.Tính f tại cực trị  5.Giới hạn đầu mút  6.Lập bảng kết luận"}'::jsonb,
  true,NOW(),NOW()),
('2a000006-0000-0000-0000-000000000002','b4000006-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: Đồng biến & Cực trị','Kiểm tra nắm vững lý thuyết đạo hàm ứng dụng',
  0,NULL,1,'{"questions":[{"q":"f đồng biến trên (a,b) khi?","options":["f(x)>0","f(x)<0","f(x)=0","f tăng 1 đoạn"],"answer":0},{"q":"ĐK cần để x0 là cực trị?","options":["f(x0)=0 hoặc không có ĐH","f(x0)>0","f(x0)=0","f liên tục tại x0"],"answer":0}]}'::jsonb,
  true,NOW(),NOW()),
('2a000007-0000-0000-0000-000000000001','b4000007-0000-0000-0000-000000000001',
  'NoteBlock','Phím tắt Figma quan trọng nhất','Shortcut giúp tăng tốc workflow',
  0,NULL,0,'{"content":"F=Frame | R=Rectangle | T=Text | P=Pen | Ctrl+G=Group | Shift+A=AutoLayout | Ctrl+Alt+K=Component | Ctrl+/=QuickAction"}'::jsonb,
  true,NOW(),NOW()),
('2a000007-0000-0000-0000-000000000002','b4000007-0000-0000-0000-000000000003',
  'VocabularyBlock','Thuật ngữ UI Design cần biết','Glossary các khái niệm cơ bản trong Figma',
  0,NULL,1,'{"words":[{"term":"Frame","definition":"Container chứa nội dung, tương đương artboard"},{"term":"Component","definition":"Yếu tố thiết kế tái sử dụng. Main + Instances"},{"term":"Auto Layout","definition":"Arrange elements như Flexbox CSS"},{"term":"Design Token","definition":"Biến lưu giá trị design dùng nhất quán"},{"term":"Prototype","definition":"Bản mô phỏng tương tác để test user flow"}]}'::jsonb,
  true,NOW(),NOW()),
('2a000008-0000-0000-0000-000000000001','b4000008-0000-0000-0000-000000000001',
  'NoteBlock','Auto Layout — Cheatsheet','Tổng hợp properties của Auto Layout',
  0,NULL,0,'{"content":"Direction: H/V | Spacing: gap | Padding: T/R/B/L | Sizing: Hug/Fill/Fixed | Min/Max Width | Wrap"}'::jsonb,
  true,NOW(),NOW()),
('2a000008-0000-0000-0000-000000000002','b4000008-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: Components & Auto Layout','Kiểm tra nắm vững Components và Auto Layout',
  0,NULL,1,'{"questions":[{"q":"Shortcut tạo Auto Layout?","options":["Shift+A","Ctrl+G","Alt+A","Ctrl+Shift+G"],"answer":0},{"q":"Main Component vs Instance?","options":["Main=nguồn Instance=bản sao đồng bộ","Không khác","Instance=nguồn","Main chỉ để export"],"answer":0}]}'::jsonb,
  true,NOW(),NOW()),
('2a000009-0000-0000-0000-000000000001','b4000009-0000-0000-0000-000000000001',
  'NoteBlock','Checklist bàn giao thiết kế cho Dev','Developer Handoff chuẩn chỉnh',
  0,NULL,0,'{"content":"[] Tên layer rõ ràng [] Color/Text Styles [] Export SVG/PNG2x [] Spacing 8px grid [] States hover/active/disabled [] Animation specs"}'::jsonb,
  true,NOW(),NOW()),
('2a000009-0000-0000-0000-000000000002','b4000009-0000-0000-0000-000000000003',
  'ExerciseBlock','Bài tập: Thiết kế Course Card Component','Thực hành Auto Layout + Component + Variants',
  0,NULL,1,'{"instruction":"Thiết kế Course Card: Thumbnail 16:9, Badge, Title 2 dòng, Teacher, Rating, Giá. Tạo Component với 2 Variants: Default/Enrolled","hint":"320px wide, Auto Layout vertical, padding 16px, gap 8px"}'::jsonb,
  true,NOW(),NOW()),
('2a00000a-0000-0000-0000-000000000001','b400000a-0000-0000-0000-000000000001',
  'NoteBlock','Kỹ thuật thở & Bình tĩnh nhanh','4-7-8 Breathing và Power Pose',
  0,NULL,0,'{"content":"4-7-8: Hít vào 4s - Nín 7s - Thở ra 8s. Lặp 3-4 lần. Power Pose: đứng thẳng tay hông 2 phút tăng testosterone giảm cortisol"}'::jsonb,
  true,NOW(),NOW()),
('2a00000a-0000-0000-0000-000000000002','b400000a-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: Tâm lý học thuyết trình','Kiểm tra hiểu biết về tâm lý và kỹ thuật bình tĩnh',
  0,NULL,1,'{"questions":[{"q":"Chứng sợ nói trước đám đông?","options":["Glossophobia","Agoraphobia","Claustrophobia","Xenophobia"],"answer":0},{"q":"5-4-3-2-1 do ai sáng tạo?","options":["Mel Robbins","Tony Robbins","Amy Cuddy","Dale Carnegie"],"answer":0}]}'::jsonb,
  true,NOW(),NOW()),
('2a00000b-0000-0000-0000-000000000001','b400000b-0000-0000-0000-000000000001',
  'NoteBlock','Template cấu trúc Opening-Body-Closing','Cấu trúc vàng cho mọi bài thuyết trình',
  0,NULL,0,'{"content":"OPENING 10-15%: Hook + Vấn đề + WIIFM | BODY 70-75%: 3 Points x (Evidence+Example) | CLOSING 10-15%: Tóm tắt + CTA + QnA"}'::jsonb,
  true,NOW(),NOW()),
('2a00000b-0000-0000-0000-000000000002','b400000b-0000-0000-0000-000000000003',
  'ExerciseBlock','Bài tập: Viết Opening 60 giây','Thực hành viết và luyện phần mở đầu thu hút',
  0,NULL,1,'{"instruction":"Viết mở đầu 60 giây: Hook (câu hỏi/số liệu) + Kết nối người nghe + Preview 3 điểm. Nói trước gương 3 lần, ghi hình lần cuối.","hint":"Hook: Bạn có biết 73% phỏng vấn thất bại không phải vì thiếu kiến thức mà vì thiếu kỹ năng trình bày?"}'::jsonb,
  true,NOW(),NOW()),
('2a00000c-0000-0000-0000-000000000001','b400000c-0000-0000-0000-000000000001',
  'NoteBlock','Checklist ngôn ngữ cơ thể chuyên nghiệp','Nên và không nên khi thuyết trình',
  0,NULL,0,'{"content":"NÊN: Eye contact 3-5s/người, cử chỉ tay tự nhiên, di chuyển có chủ đích, gật đầu khi nghe. TRÁNH: Khoanh tay, tay túi, nhìn xuống, lắc lư chân"}'::jsonb,
  true,NOW(),NOW()),
('2a00000c-0000-0000-0000-000000000002','b400000c-0000-0000-0000-000000000003',
  'QuizBlock','Quiz: Ngôn ngữ cơ thể & Slide Design','Kiểm tra kỹ năng trình bày toàn diện',
  0,NULL,1,'{"questions":[{"q":"Tốc độ nói lý tưởng?","options":["130-150 từ/phút","200-250 từ/phút","50-80 từ/phút","300+ từ/phút"],"answer":0},{"q":"Quy tắc 6x6?","options":["Tối đa 6 dòng/slide 6 từ/dòng","6 màu/slide","6 font chữ","6 hình ảnh/slide"],"answer":0}]}'::jsonb,
  true,NOW(),NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. ENROLLMENTS
-- =============================================================================
INSERT INTO "CourseEnrollments" (
  "Id","UserId","CourseId","EnrolledAt","Source","CreatedAt"
) VALUES
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000004','d0000003-0000-0000-0000-000000000001',NOW()-INTERVAL '5 days','Admin',NOW()-INTERVAL '5 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000004','d0000003-0000-0000-0000-000000000002',NOW()-INTERVAL '3 days','Admin',NOW()-INTERVAL '3 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','d0000003-0000-0000-0000-000000000001',NOW()-INTERVAL '4 days','Admin',NOW()-INTERVAL '4 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','d0000003-0000-0000-0000-000000000003',NOW()-INTERVAL '2 days','Admin',NOW()-INTERVAL '2 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','d0000003-0000-0000-0000-000000000004',NOW()-INTERVAL '1 day','Admin',NOW()-INTERVAL '1 day'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000003-0000-0000-0000-000000000001',NOW()-INTERVAL '7 days','Admin',NOW()-INTERVAL '7 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000003-0000-0000-0000-000000000002',NOW()-INTERVAL '6 days','Admin',NOW()-INTERVAL '6 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000003-0000-0000-0000-000000000003',NOW()-INTERVAL '4 days','Admin',NOW()-INTERVAL '4 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000003-0000-0000-0000-000000000004',NOW()-INTERVAL '2 days','Admin',NOW()-INTERVAL '2 days')
ON CONFLICT DO NOTHING;

COMMIT;

-- Verify
SELECT 'Course' AS "Item", "Title"::TEXT FROM "Courses" WHERE "Id"::text LIKE 'd0000003%'
UNION ALL
SELECT 'Sessions', COUNT(*)::TEXT FROM "Sessions" WHERE "ModuleId"::text LIKE 'e0000003%'
UNION ALL
SELECT 'Segments', COUNT(*)::TEXT FROM "Segments" WHERE "SessionId"::text LIKE 'f0000004%'
UNION ALL
SELECT 'LearningAssets', COUNT(*)::TEXT FROM "LearningAssets" WHERE "SegmentId"::text LIKE 'b4000%'
UNION ALL
SELECT 'Enrollments', COUNT(*)::TEXT FROM "CourseEnrollments" WHERE "CourseId"::text LIKE 'd0000003%';