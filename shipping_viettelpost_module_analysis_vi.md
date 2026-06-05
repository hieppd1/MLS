# PHÂN TÍCH NGHIỆP VỤ & THIẾT KẾ MODULE SHIPPING (VIETTEL POST)

---

# 1. TỔNG QUAN

## 1.1 Mục tiêu

Xây dựng module giao hàng tích hợp với ViettelPost cho hệ thống EdTech.

Module hỗ trợ:

- Tạo vận đơn tự động sau thanh toán
- Tracking trạng thái giao hàng
- Quản lý vận đơn trong Admin Portal
- Hiển thị trạng thái giao hàng cho học viên
- Đồng bộ trạng thái giao hàng từ ViettelPost

---

# 1.2 PHẠM VI MODULE

Module shipping chỉ áp dụng cho:

- Sách
- Bộ tài liệu
- Combo khóa học + sách
- Sản phẩm vật lý

KHÔNG áp dụng cho:

- Khóa học online thuần
- Ebook
- File download

---

# 2. KIẾN TRÚC ĐỀ XUẤT

```text
Frontend (ReactJS / React Native)
        ↓
.NET API
        ↓
Orders Module
Payments Module
Shipping Module
        ↓
PostgreSQL
        ↓
ViettelPost API
```

---

# 3. THIẾT KẾ MODULE SHIPPING

Đề xuất tách riêng module:

```text
Shipping Module
```

KHÔNG nhúng trực tiếp logic giao hàng vào OrderService.

Lý do:

- Dễ maintain
- Dễ mở rộng
- Sau này dễ thêm:
  - GHN
  - GHTK
  - J&T
- Dễ retry webhook/API

---

# 4. LUỒNG NGHIỆP VỤ

---

# 4.1 FLOW ĐẶT HÀNG

```text
Student mua sách/combo
↓
Thanh toán thành công
↓
Tạo Order
↓
Tạo Shipment ViettelPost
↓
Nhận mã vận đơn
↓
Hiển thị tracking cho user
↓
ViettelPost callback trạng thái
↓
Order auto update trạng thái giao hàng
```

---

# 4.2 FLOW TRACKING

```text
User mở chi tiết đơn hàng
↓
Xem trạng thái vận chuyển
↓
Click tracking
↓
Hiển thị lịch sử giao hàng
```

---

# 4.3 FLOW WEBHOOK

```text
ViettelPost gửi webhook
↓
/api/webhooks/viettelpost
↓
Update shipment status
↓
Update order status
↓
Push notification cho user
```

---

# 5. DATABASE DESIGN

---

# 5.1 BẢNG Orders

| Field | Type | Description |
|---|---|---|
| id | uuid | ID đơn hàng |
| orderCode | varchar(50) | Mã đơn hàng |
| userId | uuid | Người mua |
| totalAmount | decimal(18,2) | Tổng tiền |
| paymentStatus | varchar(20) | Trạng thái thanh toán |
| shippingStatus | varchar(20) | Trạng thái giao hàng |
| shippingProvider | varchar(50) | Đơn vị vận chuyển |
| createdAt | timestamptz | Ngày tạo |
| updatedAt | timestamptz | Ngày cập nhật |

---

# 5.2 BẢNG Shipments

| Field | Type | Description |
|---|---|---|
| id | uuid | ID |
| orderId | uuid | Đơn hàng |
| provider | varchar(50) | ViettelPost |
| trackingNumber | varchar(100) | Mã vận đơn |
| status | varchar(50) | Trạng thái |
| shippingFee | decimal(18,2) | Phí ship |
| receiverName | varchar(255) | Người nhận |
| receiverPhone | varchar(20) | SĐT |
| receiverAddress | text | Địa chỉ |
| provinceCode | varchar(20) | Mã tỉnh |
| districtCode | varchar(20) | Mã huyện |
| wardCode | varchar(20) | Mã xã |
| rawResponse | jsonb | Response từ ViettelPost |
| createdAt | timestamptz | Ngày tạo |
| updatedAt | timestamptz | Ngày cập nhật |

---

# 5.3 BẢNG ShipmentTrackingLogs

| Field | Type | Description |
|---|---|---|
| id | uuid | ID |
| shipmentId | uuid | Shipment |
| status | varchar(50) | Trạng thái |
| description | text | Mô tả |
| rawData | jsonb | Payload webhook |
| createdAt | timestamptz | Ngày tạo |

---

# 6. SHIPPING STATUS

Chuẩn hóa trạng thái nội bộ:

| Internal Status | Description |
|---|---|
| PENDING | Chờ lấy hàng |
| PICKED_UP | Đã lấy hàng |
| IN_TRANSIT | Đang giao |
| DELIVERED | Giao thành công |
| FAILED | Giao thất bại |
| RETURNED | Hoàn hàng |
| CANCELLED | Đã hủy |

---

# 7. API DESIGN

---

# 7.1 SHIPPING APIs

---

## Tính phí ship

```http
POST /api/shipping/calculate-fee
```

Request:

```json
{
  "provinceCode": "01",
  "districtCode": "001",
  "weight": 500
}
```

---

## Tạo shipment

```http
POST /api/shipping/create
```

---

## Lấy thông tin shipment

```http
GET /api/shipping/{id}
```

---

## Tracking shipment

```http
GET /api/shipping/tracking/{trackingNumber}
```

---

## Hủy shipment

```http
POST /api/shipping/{id}/cancel
```

---

## Đồng bộ trạng thái

```http
POST /api/shipping/{id}/sync
```

---

# 7.2 WEBHOOK APIs

---

## Webhook callback từ ViettelPost

```http
POST /api/webhooks/viettelpost
```

---

# 8. ADMIN PORTAL

---

# 8.1 DANH SÁCH VẬN ĐƠN

Hiển thị:

| Field |
|---|
| Mã đơn |
| Mã vận đơn |
| Người nhận |
| SĐT |
| Địa chỉ |
| Trạng thái |
| Phí ship |
| Ngày tạo |

---

# 8.2 ACTIONS

| Action |
|---|
| Tạo vận đơn |
| Đồng bộ trạng thái |
| Copy tracking |
| Hủy vận đơn |
| Xem tracking |

---

# 8.3 SHIPPING SETTINGS

Admin cấu hình:

| Config |
|---|
| Provider |
| API URL |
| Username |
| Password |
| Token |
| Webhook secret |

---

# 9. USER PORTAL

---

# 9.1 ORDER DETAIL PAGE

Hiển thị:

```text
Đơn hàng #12345

Sách ID Toán 12

Trạng thái:
[Đang giao hàng]

Mã vận đơn:
VT123456789

[Nút Theo dõi đơn]
```

---

# 9.2 TRACKING PAGE

Hiển thị:

| Field |
|---|
| Mã vận đơn |
| Trạng thái hiện tại |
| Timeline giao hàng |
| Ngày cập nhật |

---

# 10. FILE STORAGE

Không cần upload file đặc biệt.

Chỉ cần:

- Tracking data
- Shipment data
- Webhook logs

---

# 11. VIETTELPOST INTEGRATION

---

# 11.1 CHỨC NĂNG SỬ DỤNG

| Feature | Support |
|---|---|
| Tạo vận đơn | Có |
| Tracking | Có |
| Tính phí ship | Có |
| Hủy vận đơn | Có |
| Callback/Webhook | Có |
| Danh sách tỉnh/huyện/xã | Có |

---

# 11.2 AUTHENTICATION

Thông thường cần:

- Username
- Password
- Token API

---

# 12. SERVICE DESIGN

---

# 12.1 INTERFACE

```csharp
public interface IShippingProvider
{
    Task<CreateShipmentResult> CreateShipmentAsync();

    Task<TrackingResult> TrackShipmentAsync();

    Task<CancelShipmentResult> CancelShipmentAsync();

    Task<ShippingFeeResult> CalculateFeeAsync();
}
```

---

# 12.2 IMPLEMENTATION

```text
ViettelPostProvider : IShippingProvider
```

Sau này có thể thêm:

- GhnProvider
- GhtkProvider
- JntProvider

---

# 13. NON-FUNCTIONAL REQUIREMENTS

---

# 13.1 PERFORMANCE

- Create shipment < 5s
- Tracking < 3s

---

# 13.2 SECURITY

- Validate webhook signature
- JWT Authentication
- Log toàn bộ webhook

---

# 13.3 RETRY STRATEGY

Nếu gọi ViettelPost lỗi:

- Retry tối đa 3 lần
- Log error
- Manual sync trong admin

---

# 14. KHÔNG TRIỂN KHAI GIAI ĐOẠN NÀY

Để tránh over-engineering.

---

# KHÔNG BAO GỒM

- Warehouse Management
- Inventory Management
- Split shipment
- Route optimization
- AI logistics
- Delivery SLA analytics
- Multi-carrier optimization

---

# 15. KIẾN TRÚC CUỐI CÙNG

```text
Frontend
    ↓
.NET API
    ↓
Orders Module
Payments Module
Shipping Module
    ↓
PostgreSQL
    ↓
ViettelPost API
```

---

# 16. KẾT LUẬN

Module Shipping tích hợp ViettelPost hỗ trợ:

- Tạo vận đơn tự động
- Tracking giao hàng
- Đồng bộ trạng thái
- Quản lý shipment trong admin
- Hiển th