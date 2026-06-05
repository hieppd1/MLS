SET search_path = tenant_demo;
SET client_encoding = 'UTF8';
INSERT INTO "NotificationTemplates" ("Key", "Locale", "Title", "Body") VALUES
('course_enrolled','vi','Đăng ký thành công','Bạn đã đăng ký khoá học {{courseName}} thành công.'),
('payment_success','vi','Thanh toán thành công','Đơn hàng #{{orderId}} đã được xác nhận.'),
('new_message','vi','Tin nhắn mới','{{senderName}} đã gửi tin nhắn cho bạn.'),
('book_activated','vi','Kích hoạt sách thành công','Sách {{bookTitle}} đã được thêm vào thư viện.'),
('course_completed','vi','Hoàn thành khoá học','Chúc mừng! Bạn đã hoàn thành khoá học {{courseName}}.'),
('course_enrolled','en','Enrollment Successful','You have successfully enrolled in {{courseName}}.'),
('payment_success','en','Payment Successful','Order #{{orderId}} has been confirmed.'),
('new_message','en','New Message','{{senderName}} sent you a message.'),
('book_activated','en','Book Activated','{{bookTitle}} has been added to your library.'),
('course_completed','en','Course Completed','Congratulations! You have completed {{courseName}}.'),
('course_enrolled','ko','수강 등록 완료','{{courseName}} 강좌에 성공적으로 등록되었습니다.'),
('payment_success','ko','결제 완료','주문 #{{orderId}}가 확인되었습니다.'),
('new_message','ko','새 메시지','{{senderName}}님이 메시지를 보냈습니다.'),
('book_activated','ko','교재 활성화 완료','{{bookTitle}}이(가) 라이브러리에 추가되었습니다.'),
('course_completed','ko','강좌 완료','축하합니다! {{courseName}} 강좌를 완료했습니다.')
ON CONFLICT DO NOTHING;