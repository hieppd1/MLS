# MLS - Book Commerce Module Design (Simplified)

Version: 2.0
Author: Solution Architecture Team
System: MLS Platform

---

# 1. Tổng quan

## 1.1 Mục tiêu

Module Book Commerce được thiết kế để tích hợp vào hệ thống MLS nhằm hỗ trợ:

* Quản lý catalog sách
* Bán sách online
* Bán ebook
* Thanh toán online
* Quản lý đơn hàng
* Kích hoạt tài nguyên học tập
* Mapping sách với tài nguyên LMS

Thiết kế tập trung vào:

```text
Simple
Lightweight
Easy Integration
LMS Oriented
```

---

## 1.2 Phạm vi

### Bao gồm

* Catalog sách
* Bán sách in
* Bán ebook
* Cart
* Checkout
* Payment
* Order Management
* Activation code
* Unlock learning resources
* CMS integration

---

### Không bao gồm

* Inventory management
* Warehouse management
* Shipping provider integration
* Multi warehouse
* Marketplace
* ERP integration

---

# 2. Kiến trúc tổng quan

```text
Frontend (React / NextJS)
        |
API Gateway
        |
---------------------------------------------
| Catalog Service
| Cart Service
| Order Service
| Payment Service
| Activation Service
| Resource Mapping Service
---------------------------------------------
        |
---------------------------------------------
| PostgreSQL
| Redis
| RabbitMQ
| MinIO/S3
---------------------------------------------
```

---

# 3. Domain Design

## 3.1 Book Domain

```text
BOOK DOMAIN
├── Catalog
├── Pricing
├── Cart
├── Checkout
├── Order
├── Payment
├── Activation
├── Resource Mapping
└── CMS Integration
```

---

## 3.2 Module Overview

| Module           | Mô tả chức năng                | Chức năng chính                |
| ---------------- | ------------------------------ | ------------------------------ |
| Catalog          | Quản lý danh mục sách và ebook | CRUD sách, category, tags, SEO |
| Pricing          | Quản lý giá bán và khuyến mãi  | Giá gốc, giá sale, voucher     |
| Cart             | Quản lý giỏ hàng               | Add/remove/update item         |
| Checkout         | Xử lý xác nhận mua hàng        | Validate cart, payment method  |
| Order            | Quản lý đơn hàng               | Create/update order            |
| Payment          | Thanh toán online              | Payment request/callback       |
| Activation       | Unlock tài nguyên học tập      | Verify/activate code           |
| Resource Mapping | Mapping sách với LMS resource  | Course/Quiz/Video/Document     |
| CMS Integration  | Hiển thị nội dung marketing    | Banner/carousel/recommend      |

---

# 4. Catalog Module

## 4.1 Mục tiêu

Quản lý catalog:

* sách in
* ebook
* combo

---

## 4.2 Book Types

```text
PHYSICAL_BOOK
EBOOK
COMBO
```

---

## 4.3 Book Entity

```csharp
public class Book
{
    public Guid Id { get; set; }

    public string Code { get; set; }

    public string Title { get; set; }

    public string Slug { get; set; }

    public string Description { get; set; }

    public string ShortDescription { get; set; }

    public decimal Price { get; set; }

    public decimal? SalePrice { get; set; }

    public BookType Type { get; set; }

    public string ThumbnailUrl { get; set; }

    public string PreviewFileUrl { get; set; }

    public bool IsPublished { get; set; }

    public bool IsActivationRequired { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
```

---

## 4.4 Category Entity

```csharp
public class Category
{
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string Slug { get; set; }

    public Guid? ParentId { get; set; }

    public int DisplayOrder { get; set; }
}
```

---

## 4.5 Search & Filter

### Filters

* Category
* Tags
* Book type
* Price range
* Newest
* Bestseller

---

### Search Fields

* Title
* Description
* Tags
* Author

---

# 5. Pricing Module

## 5.1 Chức năng

* Base price
* Sale price
* Voucher
* Combo pricing

---

## 5.2 Pricing Flow

```text
Base Price
→ Apply Promotion
→ Apply Voucher
→ Final Price
```

---

## 5.3 Voucher Entity

```csharp
public class Voucher
{
    public Guid Id { get; set; }

    public string Code { get; set; }

    public decimal Value { get; set; }

    public VoucherType Type { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }
}
```

---

# 6. Cart Module

## 6.1 Cart Entity

```csharp
public class Cart
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public decimal TotalAmount { get; set; }

    public ICollection<CartItem> Items { get; set; }
}
```

---

## 6.2 Cart Item

```csharp
public class CartItem
{
    public Guid Id { get; set; }

    public Guid CartId { get; set; }

    public Guid BookId { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }
}
```

---

## 6.3 Cart Validation

### Ebook

* Không cho mua trùng nếu đã sở hữu

### Physical Book

* Giới hạn quantity theo cấu hình

---

# 7. Checkout Module

## 7.1 Checkout Flow

```text
Cart
→ Validate
→ Create Pending Order
→ Redirect Payment
→ Payment Callback
→ Confirm Order
```

---

## 7.2 Checkout Validation

* Cart valid
* Voucher valid
* Payment method valid

---

## 7.3 Shipping Address

Chỉ lưu địa chỉ để admin xử lý giao hàng thủ công.

```csharp
public class ShippingAddress
{
    public string FullName { get; set; }

    public string PhoneNumber { get; set; }

    public string Province { get; set; }

    public string District { get; set; }

    public string Ward { get; set; }

    public string AddressLine { get; set; }
}
```

---

# 8. Order Module

## 8.1 Order Status

```text
PENDING
WAITING_PAYMENT
PAID
PROCESSING
COMPLETED
CANCELLED
FAILED
```

---

## 8.2 Order Entity

```csharp
public class Order
{
    public Guid Id { get; set; }

    public string OrderCode { get; set; }

    public Guid UserId { get; set; }

    public OrderStatus Status { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal FinalAmount { get; set; }

    public PaymentStatus PaymentStatus { get; set; }

    public DateTime CreatedAt { get; set; }
}
```

---

## 8.3 Order Item

```csharp
public class OrderItem
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public Guid BookId { get; set; }

    public string BookName { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }
}
```

---

# 9. Payment Module

## 9.1 Supported Gateways

* VNPay
* MoMo
* QR Banking

---

## 9.2 Payment Flow

```text
Checkout
→ Create Payment Request
→ Redirect Gateway
→ Callback
→ Verify Signature
→ Update Payment Status
→ Publish OrderPaidEvent
```

---

## 9.3 Payment Entity

```csharp
public class Payment
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public string Gateway { get; set; }

    public string TransactionCode { get; set; }

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; }

    public DateTime? PaidAt { get; set; }
}
```

---

# 10. Activation Module

## 10.1 Mục tiêu

Unlock:

* ebook
* video
* course
* quiz
* document

---

## 10.2 Activation Flow

```text
Order Paid
→ Generate Activation Code
→ User Activate
→ Unlock Resources
```

---

## 10.3 Activation Status

```text
NEW
ACTIVATED
EXPIRED
BLOCKED
```

---

## 10.4 Activation Entity

```csharp
public class ActivationCode
{
    public Guid Id { get; set; }

    public string Code { get; set; }

    public Guid BookId { get; set; }

    public Guid? UserId { get; set; }

    public ActivationStatus Status { get; set; }

    public DateTime? ActivatedAt { get; set; }
}
```

---

## 10.5 Activation APIs

### Verify

```http
POST /api/activation/verify
```

### Activate

```http
POST /api/activation/activate
```

---

# 11. Resource Mapping Module

## 11.1 Mục tiêu

Mapping sách với:

* Course
* Lesson
* Quiz
* Video
* Document

---

## 11.2 Resource Types

```text
COURSE
LESSON
QUIZ
VIDEO
DOCUMENT
```

---

## 11.3 Mapping Entity

```csharp
public class BookResourceMapping
{
    public Guid Id { get; set; }

    public Guid BookId { get; set; }

    public ResourceType ResourceType { get; set; }

    public Guid ResourceId { get; set; }
}
```

---

# 12. Ebook Access Design

## 12.1 Ebook Access Flow

```text
Purchase Ebook
→ Payment Success
→ Create Entitlement
→ User Open Ebook
```

---

## 12.2 Ebook Security

### Simple

* Signed URL
* Expired download link

### Advanced

* PDF watermark
* DRM viewer
* Online reader only

---

## 12.3 Ebook Storage

```text
MinIO / S3
```

---

# 13. My Books Module

## 13.1 Features

* Purchased books
* Ebook library
* Activated books
* Continue learning
* Download ebook

---

## 13.2 UI Sections

```text
My Books
├── Purchased
├── Ebook Library
├── Activated
└── Learning Progress
```

---

# 14. CMS Integration

## 14.1 Components

* Hero banner
* Book carousel
* Bestseller
* Combo section
* Recommended books

---

## 14.2 CMS Section Entity

```csharp
public class CmsSection
{
    public Guid Id { get; set; }

    public string Type { get; set; }

    public string Title { get; set; }

    public int DisplayOrder { get; set; }
}
```

---

# 15. API Design

## 15.1 Catalog APIs

```http
GET /api/books
GET /api/books/{slug}
GET /api/books/recommended
```

---

## 15.2 Cart APIs

```http
GET /api/cart

POST /api/cart/items

PUT /api/cart/items/{id}

DELETE /api/cart/items/{id}
```

---

## 15.3 Checkout APIs

```http
POST /api/checkout
POST /api/payment/callback
```

---

## 15.4 Order APIs

```http
GET /api/orders
GET /api/orders/{id}
```

---

## 15.5 Activation APIs

```http
POST /api/activation/verify
POST /api/activation/activate
```

---

# 16. Event Driven Design

## 16.1 Events

```text
OrderCreatedEvent
OrderPaidEvent
PaymentFailedEvent
BookActivatedEvent
```

---

## 16.2 Event Flow

```text
OrderPaidEvent
→ GenerateActivationCode
→ UnlockEbook
→ SendEmail
```

---

# 17. Database Design

## 17.1 Main Tables

```text
books
categories
book_tags

vouchers

carts
cart_items

orders
order_items

payments

activation_codes

book_resource_mappings
```

---

## 17.2 Suggested Database

```text
PostgreSQL
```

---

# 18. Security Design

## 18.1 Security Requirements

* JWT authentication
* Payment signature verification
* Signed ebook URL
* Admin RBAC

---

## 18.2 Admin Roles

```text
SUPER_ADMIN
BOOK_ADMIN
ORDER_ADMIN
CONTENT_ADMIN
```

---

# 19. Suggested Technology Stack

## Backend

```text
.NET 8
Clean Architecture
MediatR
EF Core
```

---

## Frontend

```text
ReactJS
NextJS
TailwindCSS
```

---

## Infrastructure

```text
PostgreSQL
Redis
RabbitMQ
MinIO/S3
```

---

# 20. Roadmap

## Phase 1

* Catalog
* Cart
* Checkout
* Payment
* Orders

---

## Phase 2

* Ebook Library
* Activation
* Resource Mapping

---

## Phase 3

* Recommendation
* Analytics
* CRM Integration

---

# 21. Key Design Decisions

## 21.1 Book != Course

Không hardcode:

```text
1 Book = 1 Course
```

Phải hỗ trợ:

```text
1 Book = Multiple Resources
```

---

## 21.2 Activation là Shared Service

Activation có thể dùng cho:

* ebook
* subscription
* premium feature
* license

---

## 21.3 Commerce Domain độc lập LMS

Book module chỉ mapping resource.

Không phụ thuộc trực tiếp:

* quiz module
* course module
* lesson module

---

# 22. Kết luận

Book Commerce Module của MLS được thiết kế theo hướng:

```text
Lightweight Commerce Layer
+
Ebook Platform
+
Learning Resource Unlock System
```

Đảm bảo:

* dễ triển khai
* dễ maintain
* LMS integration clean
* mở rộng ebook dễ dàng
* reusable activation design
