-- ============================================================
-- Seed: Requirements & TargetAudience for all 8 courses on VPS
-- ============================================================
\encoding UTF8
SET client_encoding = 'UTF8';
SET search_path TO tenant_demo, public;

BEGIN;

-- ============================================================
-- 1. Tiếng Anh Giao Tiếp Cơ Bản (Level 1 - Beginner)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Không cần có kiến thức tiếng Anh trước","Có thiết bị kết nối internet để xem video bài giảng","Sẵn sàng dành 20–30 phút mỗi ngày để luyện tập","Tinh thần cầu tiến và sẵn sàng thực hành giao tiếp"]',
  "TargetAudience" = '["Người mới bắt đầu học tiếng Anh từ con số 0","Người đã học tiếng Anh nhưng chưa tự tin khi nói chuyện","Nhân viên văn phòng muốn cải thiện tiếng Anh giao tiếp","Sinh viên muốn nâng cao khả năng giao tiếp tiếng Anh","Người chuẩn bị làm việc trong môi trường quốc tế"]'
WHERE "Id" = 'd0000001-0000-0000-0000-000000000001';

-- ============================================================
-- 2. Ngữ Pháp Tiếng Anh Từ A-Z (Level 2 - Intermediate)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Biết bảng chữ cái và từ vựng cơ bản tiếng Anh","Đã học tiếng Anh ít nhất 3–6 tháng ở bất kỳ đâu","Sẵn sàng làm bài tập thực hành sau mỗi bài học","Có sổ tay ghi chép công thức và cấu trúc ngữ pháp"]',
  "TargetAudience" = '["Người muốn hệ thống hóa lại toàn bộ kiến thức ngữ pháp","Học sinh THCS, THPT cần củng cố ngữ pháp tiếng Anh","Người đang ôn thi TOEIC, IELTS hoặc chứng chỉ Cambridge","Người tự học tiếng Anh muốn có nền tảng ngữ pháp vững chắc","Giáo viên tiếng Anh muốn bổ sung và hệ thống hóa kiến thức"]'
WHERE "Id" = 'd0000001-0000-0000-0000-000000000002';

-- ============================================================
-- 3. Luyện Thi IELTS 6.5+ (Level 4 - Advanced)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Trình độ tiếng Anh tương đương B1–B2 (CEFR) trở lên","Đã biết sơ lược cấu trúc bài thi IELTS 4 kỹ năng","Sẵn sàng dành 2–3 giờ mỗi ngày luyện tập liên tục","Có tài liệu IELTS chính thức từ Cambridge hoặc British Council","Cam kết học trong ít nhất 3 tháng để đạt mục tiêu"]',
  "TargetAudience" = '["Học sinh, sinh viên cần IELTS để nộp hồ sơ du học","Người cần điểm IELTS cho visa định cư hoặc làm việc nước ngoài","Chuyên gia muốn nâng điểm từ 5.0–6.0 lên mức 6.5+","Người đã thi IELTS chưa đạt mục tiêu, muốn thi lại","Học giả và giáo viên cần IELTS cho học bổng hoặc chương trình đào tạo"]'
WHERE "Id" = 'd0000001-0000-0000-0000-000000000003';

-- ============================================================
-- 4. Học tiếng Việt cơ bản (Level 1 - Beginner, for foreigners)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Không cần có kinh nghiệm học tiếng Việt trước","Có thiết bị kết nối internet để xem video bài giảng","Sẵn sàng dành 15–30 phút mỗi ngày để luyện tập","Có tinh thần học hỏi và muốn khám phá ngôn ngữ mới"]',
  "TargetAudience" = '["Người nước ngoài đang sinh sống hoặc làm việc tại Việt Nam","Du khách muốn giao tiếp cơ bản khi du lịch Việt Nam","Người có bạn bè hoặc người thân là người Việt Nam","Sinh viên quốc tế đang theo học tại các trường đại học Việt Nam","Người muốn tìm hiểu văn hóa Việt Nam qua ngôn ngữ"]'
WHERE "Id" = 'd0000002-0000-0000-0000-000000000001';

-- ============================================================
-- 5. Lập Trình Python Từ Cơ Bản đến Nâng Cao (Level 1 - Beginner)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Không cần kinh nghiệm lập trình hay kỹ thuật trước","Máy tính có thể cài đặt Python 3.x (Windows, Mac, Linux)","Sẵn sàng dành ít nhất 1 giờ mỗi ngày để code thực hành","Kết nối internet ổn định để cài đặt thư viện và tải tài liệu"]',
  "TargetAudience" = '["Người mới bắt đầu học lập trình hoàn toàn từ đầu","Sinh viên các ngành kỹ thuật, khoa học, kinh tế muốn biết code","Người muốn chuyển sang ngành lập trình hoặc data","Nhân viên văn phòng muốn tự động hóa công việc bằng Python","Người quan tâm đến AI và Machine Learning cần nền tảng Python"]'
WHERE "Id" = 'd0000003-0000-0000-0000-000000000001';

-- ============================================================
-- 6. Toán THPT: Giải Tích Căn Bản (Level 3 - Intermediate+)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Đang học hoặc đã học lớp 10–11, nắm vững toán lớp 10","Có sách giáo khoa Toán 11–12 hoặc tài liệu tham khảo","Sẵn sàng luyện bài tập ít nhất 45 phút mỗi ngày","Máy tính bỏ túi (hoặc app) để kiểm tra kết quả tính toán"]',
  "TargetAudience" = '["Học sinh lớp 11–12 muốn nắm chắc kiến thức giải tích","Học sinh đang ôn thi THPT Quốc Gia môn Toán","Học sinh muốn điểm Toán cao để xét tuyển đại học","Học sinh thi khối A, A1 vào các trường đại học top","Phụ huynh và gia sư muốn có tài liệu giảng dạy hệ thống"]'
WHERE "Id" = 'd0000003-0000-0000-0000-000000000002';

-- ============================================================
-- 7. Thiết Kế UI/UX với Figma (Level 2 - Intermediate)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Không cần biết lập trình hay coding","Máy tính có thể chạy Figma (trình duyệt web hoặc app desktop)","Tài khoản Figma miễn phí — tạo tại figma.com trước khi học","Thẩm mỹ cơ bản và đam mê sáng tạo giao diện","Sẵn sàng thực hành dự án thực tế ngay từ bài học đầu tiên"]',
  "TargetAudience" = '["Người muốn bắt đầu sự nghiệp UI/UX Designer","Developer muốn hiểu thiết kế để hợp tác tốt hơn với designer","Sinh viên ngành CNTT, Truyền thông, Mỹ thuật ứng dụng","Chủ doanh nghiệp muốn tự thiết kế giao diện sản phẩm","Freelancer muốn bổ sung kỹ năng thiết kế vào hồ sơ năng lực"]'
WHERE "Id" = 'd0000003-0000-0000-0000-000000000003';

-- ============================================================
-- 8. Kỹ Năng Thuyết Trình Chuyên Nghiệp (Level 2 - Intermediate)
-- ============================================================
UPDATE "Courses" SET
  "Requirements" = '["Không yêu cầu kinh nghiệm thuyết trình chuyên nghiệp trước","Sẵn sàng thực hành thuyết trình và nhận phản hồi trong khóa học","Có thiết bị ghi âm hoặc ghi video đơn giản để tự đánh giá","Cởi mở với việc tiếp nhận góp ý và cải thiện liên tục"]',
  "TargetAudience" = '["Nhân viên văn phòng muốn tự tin thuyết trình trước đám đông","Sinh viên sắp ra trường cần kỹ năng bảo vệ đồ án, luận văn","Quản lý và lãnh đạo muốn nâng cao kỹ năng trình bày chiến lược","Giáo viên và đào tạo viên muốn cải thiện hiệu quả giảng dạy","Người chuẩn bị pitch sản phẩm hoặc thuyết phục nhà đầu tư"]'
WHERE "Id" = 'd0000003-0000-0000-0000-000000000004';

COMMIT;

-- Verification
SET search_path TO tenant_demo, public;
SELECT
  LEFT("Title", 40) AS title,
  CASE WHEN "Requirements" IS NOT NULL THEN 'OK' ELSE 'NULL' END AS req,
  CASE WHEN "TargetAudience" IS NOT NULL THEN 'OK' ELSE 'NULL' END AS ta
FROM "Courses"
ORDER BY "CreatedAt";

SELECT 'Requirements & TargetAudience seeded for all courses.' AS result;
