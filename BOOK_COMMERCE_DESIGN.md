# Book Commerce Module — Thiết kế chi tiết & Kế hoạch phát triển

**Phiên bản:** 1.0  
**Hệ thống:** MLS Platform (.NET 10 · Next.js · PostgreSQL)  
**Ngày tạo:** 21/05/2026

---

## Mục lục

1. [Tổng quan & Tích hợp](#1-tổng-quan--tích-hợp)
2. [Kiến trúc module](#2-kiến-trúc-module)
3. [Database Schema](#3-database-schema)
4. [Domain Entities](#4-domain-entities)
5. [Application Layer (CQRS)](#5-application-layer-cqrs)
6. [API Endpoints](#6-api-endpoints)
7. [Payment Integration](#7-payment-integration)
8. [Event-Driven Design](#8-event-driven-design)
9. [Ebook Security](#9-ebook-security)
10. [Frontend — Pages & Components](#10-frontend--pages--components)
11. [Phase Plan & Task Breakdown](#11-phase-plan--task-breakdown)
12. [Definition of Done](#12-definition-of-done)

---

## 1. Tổng quan & Tích hợp

### 1.1 Mục tiêu

Module Book Commerce bổ sung luồng thương mại điện tử vào MLS, cho phép:

| Tính năng | Mô tả |
|---|---|
| Bán sách in | Catalog → Cart → Checkout → Payment → Order |
| Bán ebook | Tự động unlock quyền đọc sau khi thanh toán |
| Bán combo | Nhiều sách/tài nguyên đóng gói |
| Activation code | Mã kích hoạt gắn với sách in → mở tài nguyên LMS |
| Resource mapping | 1 sách → N courses / videos / quizzes / documents |

### 1.2 Tích hợp với hệ thống hiện tại

```
MLS hiện tại                    Book Commerce Module
─────────────────────           ────────────────────────────
User                    ←──→    Cart, Order, EbookEntitlement
TeacherProfile          ←──→    Book.AuthorId (optional)
Course                  ←──→    BookResourceMapping.ResourceId
LearningAsset (video)   ←──→    BookResourceMapping.ResourceId
Tenant (multi-tenant)   ←──→    books.tenant_id, orders.tenant_id
PackageEntitlement      ←──→    EbookEntitlement (same pattern)
```

### 1.3 Nguyên tắc thiết kế

- **Commerce domain độc lập LMS** — chỉ lưu `ResourceId`, không import trực tiếp Course entity.
- **Activation là shared service** — dùng lại được cho subscription, premium feature sau này.
- **1 Book → N Resources** — không hardcode 1 book = 1 course.
- **Payment signature bắt buộc verify** — chống giả mạo callback.
- **Signed URL cho ebook** — không expose file storage URL trực tiếp.

---

## 2. Kiến trúc module

```
Frontend (Next.js)
  /sach               — Catalog
  /gio-hang           — Cart
  /thanh-toan         — Checkout
  /don-hang           — My Orders
  /kich-hoat          — Activation
  /thu-vien-sach      — My Books / Ebook Library
  /admin/sach         — Admin Book Management
        │
        ▼
MLS.API Controllers
  BooksController
  CartController
  CheckoutController
  OrdersController
  PaymentController
  ActivationController
  MyBooksController
  Admin/BookAdminController
  Admin/OrderAdminController
        │
        ▼
MLS.Application (CQRS / MediatR)
  Catalog Queries   Cart Commands   Order Commands
  Payment Commands  Activation Cmds EbookEntitlement Cmds
        │
        ▼
MLS.Domain / MLS.Infrastructure
  PostgreSQL  Redis(cache)  MinIO/S3(ebook files)  RabbitMQ(events)
```

---

## 3. Database Schema

> Schema: `tenant_demo` (multi-tenant, nhất quán với hệ thống hiện tại)

### 3.1 books

```sql
CREATE TABLE books (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    code                    VARCHAR(50),
    title                   VARCHAR(500) NOT NULL,
    slug                    VARCHAR(500) UNIQUE NOT NULL,
    short_description       TEXT,
    description             TEXT,
    type                    VARCHAR(30) NOT NULL,    -- PHYSICAL_BOOK | EBOOK | COMBO
    price                   NUMERIC(18,2) NOT NULL DEFAULT 0,
    sale_price              NUMERIC(18,2),
    sale_ends_at            TIMESTAMPTZ,
    thumbnail_url           VARCHAR(1000),
    preview_file_url        VARCHAR(1000),           -- public preview PDF
    file_key                VARCHAR(1000),           -- internal S3 key (ebook, không expose)
    file_size_bytes         BIGINT,
    page_count              INT,
    authors                 JSONB DEFAULT '[]',      -- ["Nguyễn Văn A", "Trần Thị B"]
    tags                    JSONB DEFAULT '[]',
    isbn                    VARCHAR(20),
    published_year          INT,
    language                VARCHAR(10) DEFAULT 'VI',
    is_published            BOOLEAN NOT NULL DEFAULT FALSE,
    is_activation_required  BOOLEAN NOT NULL DEFAULT FALSE,
    stock_quantity          INT DEFAULT 0,           -- chỉ dùng cho PHYSICAL_BOOK
    category_id             UUID REFERENCES book_categories(id),
    meta_title              VARCHAR(300),
    meta_description        VARCHAR(500),
    display_order           INT DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_tenant_published ON books(tenant_id, is_published);
CREATE INDEX idx_books_slug ON books(slug);
CREATE INDEX idx_books_type ON books(type);
CREATE INDEX idx_books_category ON books(category_id);
```

### 3.2 book_categories

```sql
CREATE TABLE book_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL,
    parent_id       UUID REFERENCES book_categories(id),
    icon_url        VARCHAR(500),
    display_order   INT DEFAULT 0
);
```

### 3.3 book_resource_mappings

```sql
CREATE TABLE book_resource_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    resource_type   VARCHAR(30) NOT NULL,  -- COURSE | LESSON | QUIZ | VIDEO | DOCUMENT
    resource_id     UUID NOT NULL,
    description     VARCHAR(500),
    display_order   INT DEFAULT 0
);

CREATE INDEX idx_brm_book_id ON book_resource_mappings(book_id);
```

### 3.4 vouchers

```sql
CREATE TABLE vouchers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(200),
    type                VARCHAR(20) NOT NULL,   -- FIXED | PERCENT
    value               NUMERIC(18,2) NOT NULL,
    min_order_amount    NUMERIC(18,2) DEFAULT 0,
    max_discount_amount NUMERIC(18,2),          -- giới hạn tối đa khi type=PERCENT
    usage_limit         INT,                    -- NULL = không giới hạn
    usage_count         INT NOT NULL DEFAULT 0,
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);
```

### 3.5 carts

```sql
CREATE TABLE carts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    voucher_code    VARCHAR(50),
    discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id         UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id),
    quantity        INT NOT NULL DEFAULT 1,
    unit_price      NUMERIC(18,2) NOT NULL,
    book_snapshot   JSONB NOT NULL              -- {title, thumbnail, type, slug}
);

CREATE UNIQUE INDEX idx_cart_items_unique ON cart_items(cart_id, book_id);
```

### 3.6 orders

```sql
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    order_code          VARCHAR(30) NOT NULL UNIQUE,  -- MLSyyyyMMdd-XXXXX
    user_id             UUID NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING | WAITING_PAYMENT | PAID | PROCESSING | COMPLETED | CANCELLED | FAILED
    total_amount        NUMERIC(18,2) NOT NULL,
    discount_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    final_amount        NUMERIC(18,2) NOT NULL,
    voucher_code        VARCHAR(50),
    -- Shipping (chỉ cho PHYSICAL_BOOK)
    shipping_name       VARCHAR(200),
    shipping_phone      VARCHAR(20),
    shipping_province   VARCHAR(100),
    shipping_district   VARCHAR(100),
    shipping_ward       VARCHAR(100),
    shipping_address_line VARCHAR(500),
    notes               TEXT,
    payment_status      VARCHAR(20) DEFAULT 'UNPAID',  -- UNPAID | PAID | REFUNDED
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL,
    book_title      VARCHAR(500) NOT NULL,       -- snapshot tại thời điểm mua
    book_type       VARCHAR(30) NOT NULL,
    book_thumbnail  VARCHAR(1000),
    quantity        INT NOT NULL DEFAULT 1,
    unit_price      NUMERIC(18,2) NOT NULL,
    total_price     NUMERIC(18,2) NOT NULL
);

CREATE INDEX idx_orders_user_tenant ON orders(tenant_id, user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### 3.7 payments

```sql
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    gateway             VARCHAR(20) NOT NULL,    -- VNPAY | MOMO | QRBANKING
    gateway_tx_id       VARCHAR(200),            -- transaction ID từ gateway
    gateway_response    JSONB,                   -- raw response để debug
    amount              NUMERIC(18,2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING | SUCCESS | FAILED | REFUNDED
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_gateway_tx ON payments(gateway_tx_id);
```

### 3.8 activation_codes

```sql
CREATE TABLE activation_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    code            VARCHAR(30) NOT NULL UNIQUE, -- XXXX-XXXX-XXXX-XXXX
    book_id         UUID NOT NULL REFERENCES books(id),
    order_id        UUID REFERENCES orders(id),
    order_item_id   UUID,
    user_id         UUID,                        -- NULL = chưa kích hoạt
    status          VARCHAR(20) NOT NULL DEFAULT 'NEW',
    -- NEW | ACTIVATED | EXPIRED | BLOCKED
    activated_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activation_code ON activation_codes(code);
CREATE INDEX idx_activation_user ON activation_codes(user_id);
```

### 3.9 ebook_entitlements

```sql
CREATE TABLE ebook_entitlements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    book_id         UUID NOT NULL REFERENCES books(id),
    order_id        UUID REFERENCES orders(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,                 -- NULL = vĩnh viễn
    UNIQUE(user_id, book_id)
);

CREATE INDEX idx_ebook_entitlements_user ON ebook_entitlements(user_id);
```

---

## 4. Domain Entities

> Pattern: private constructor + static `Create()` factory, kế thừa `BaseEntity`, nhất quán với `Course.cs`.

### 4.1 Book

```csharp
// MLS.Domain/Entities/Book/
public enum BookType { PhysicalBook, Ebook, Combo }

public class Book : BaseEntity
{
    public string     Code                 { get; private set; } = string.Empty;
    public string     Title                { get; private set; } = string.Empty;
    public string     Slug                 { get; private set; } = string.Empty;
    public string?    ShortDescription     { get; private set; }
    public string?    Description          { get; private set; }
    public BookType   Type                 { get; private set; }
    public decimal    Price                { get; private set; }
    public decimal?   SalePrice            { get; private set; }
    public DateTime?  SaleEndsAt           { get; private set; }
    public string?    ThumbnailUrl         { get; private set; }
    public string?    PreviewFileUrl       { get; private set; }
    public string?    FileKey              { get; private set; }  // internal only
    public long?      FileSizeBytes        { get; private set; }
    public int?       PageCount            { get; private set; }
    public string     Authors              { get; private set; } = "[]"; // JSON
    public string     Tags                 { get; private set; } = "[]"; // JSON
    public string?    Isbn                 { get; private set; }
    public int?       PublishedYear        { get; private set; }
    public bool       IsPublished          { get; private set; }
    public bool       IsActivationRequired { get; private set; }
    public int        StockQuantity        { get; private set; }
    public Guid?      CategoryId           { get; private set; }

    public ICollection<BookResourceMapping> ResourceMappings { get; private set; } = [];

    private Book() { }

    public static Book Create(string title, BookType type, decimal price, Guid createdBy,
        string? shortDescription = null, string? description = null,
        decimal? salePrice = null, string? thumbnailUrl = null,
        bool isActivationRequired = false, Guid? categoryId = null)
        => new()
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Slug = GenerateSlug(title),
            Type = type,
            Price = price,
            SalePrice = salePrice,
            ShortDescription = shortDescription?.Trim(),
            Description = description?.Trim(),
            ThumbnailUrl = thumbnailUrl,
            IsActivationRequired = isActivationRequired,
            CategoryId = categoryId,
            IsPublished = false
        };

    public decimal GetEffectivePrice()
        => SalePrice.HasValue && SaleEndsAt > DateTime.UtcNow ? SalePrice.Value : Price;

    private static string GenerateSlug(string title) =>
        System.Text.RegularExpressions.Regex
            .Replace(title.ToLower().Trim(), @"[^a-z0-9\-]", "-")
            .Trim('-');
}
```

### 4.2 Order

```csharp
public enum OrderStatus
{
    Pending, WaitingPayment, Paid, Processing, Completed, Cancelled, Failed
}
public enum PaymentStatus { Unpaid, Paid, Refunded }

public class Order : BaseEntity
{
    public string        OrderCode      { get; private set; } = string.Empty;
    public Guid          UserId         { get; private set; }
    public OrderStatus   Status         { get; private set; } = OrderStatus.Pending;
    public decimal       TotalAmount    { get; private set; }
    public decimal       DiscountAmount { get; private set; }
    public decimal       FinalAmount    { get; private set; }
    public string?       VoucherCode    { get; private set; }
    public PaymentStatus PaymentStatus  { get; private set; } = PaymentStatus.Unpaid;
    public DateTime?     PaidAt         { get; private set; }
    public ShippingAddress? Shipping    { get; private set; }

    public ICollection<OrderItem> Items { get; private set; } = [];

    private Order() { }

    public static Order Create(Guid userId, decimal totalAmount, decimal discountAmount,
        string? voucherCode = null, ShippingAddress? shipping = null)
    {
        var finalAmount = totalAmount - discountAmount;
        return new()
        {
            Id = Guid.NewGuid(),
            OrderCode = GenerateOrderCode(),
            UserId = userId,
            TotalAmount = totalAmount,
            DiscountAmount = discountAmount,
            FinalAmount = finalAmount < 0 ? 0 : finalAmount,
            VoucherCode = voucherCode,
            Shipping = shipping,
            Status = OrderStatus.Pending
        };
    }

    public void MarkPaid(DateTime paidAt)
    {
        Status = OrderStatus.Paid;
        PaymentStatus = PaymentStatus.Paid;
        PaidAt = paidAt;
    }

    public void Cancel() => Status = OrderStatus.Cancelled;

    private static string GenerateOrderCode()
        => $"MLS{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}";
}
```

### 4.3 ActivationCode

```csharp
public enum ActivationStatus { New, Activated, Expired, Blocked }

public class ActivationCode : BaseEntity
{
    public string           Code        { get; private set; } = string.Empty;
    public Guid             BookId      { get; private set; }
    public Guid?            OrderId     { get; private set; }
    public Guid?            UserId      { get; private set; }
    public ActivationStatus Status      { get; private set; } = ActivationStatus.New;
    public DateTime?        ActivatedAt { get; private set; }
    public DateTime?        ExpiresAt   { get; private set; }

    private ActivationCode() { }

    public static ActivationCode Generate(Guid bookId, Guid orderId)
        => new()
        {
            Id = Guid.NewGuid(),
            Code = GenerateCode(),
            BookId = bookId,
            OrderId = orderId,
            Status = ActivationStatus.New
        };

    public void Activate(Guid userId)
    {
        if (Status != ActivationStatus.New) throw new InvalidOperationException("Code is not activatable.");
        UserId = userId;
        Status = ActivationStatus.Activated;
        ActivatedAt = DateTime.UtcNow;
    }

    private static string GenerateCode()
    {
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        string Seg() => new(Enumerable.Range(0, 4).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        return $"{Seg()}-{Seg()}-{Seg()}-{Seg()}";
    }
}
```

### 4.4 EbookEntitlement

```csharp
public class EbookEntitlement : BaseEntity
{
    public Guid      UserId    { get; private set; }
    public Guid      BookId    { get; private set; }
    public Guid?     OrderId   { get; private set; }
    public DateTime  GrantedAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }

    public bool IsActive => ExpiresAt == null || ExpiresAt > DateTime.UtcNow;

    private EbookEntitlement() { }

    public static EbookEntitlement Grant(Guid userId, Guid bookId, Guid orderId, DateTime? expiresAt = null)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BookId = bookId,
            OrderId = orderId,
            GrantedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt
        };
}
```

---

## 5. Application Layer (CQRS)

### 5.1 Commands

```
Book/
  Commands/
    CreateBookCommand.cs
    UpdateBookCommand.cs
    PublishBookCommand.cs
    DeleteBookCommand.cs
    AddResourceMappingCommand.cs

Cart/
  Commands/
    AddToCartCommand.cs          → validate ebook duplicate, stock, price
    UpdateCartItemCommand.cs
    RemoveCartItemCommand.cs
    ClearCartCommand.cs
    ApplyVoucherCommand.cs       → validate code, expiry, min amount
    RemoveVoucherCommand.cs
  Queries/
    GetCartQuery.cs

Checkout/
  Commands/
    CreateCheckoutCommand.cs     → cart → pending order, return orderId
    ConfirmPaymentCommand.cs     → internal, triggered by payment callback

Order/
  Commands/
    CancelOrderCommand.cs
  Queries/
    GetMyOrdersQuery.cs
    GetOrderByIdQuery.cs
    GetOrderDetailAdminQuery.cs

Payment/
  Commands/
    CreatePaymentRequestCommand.cs   → tạo URL redirect gateway
    HandleVnpayCallbackCommand.cs    → verify sig, update payment/order
    HandleMomoCallbackCommand.cs

Activation/
  Commands/
    VerifyActivationCodeCommand.cs   → check valid, return book info
    ActivateCodeCommand.cs           → activate + unlock resources
  Queries/
    GetMyActivationCodesQuery.cs

EbookEntitlement/
  Commands/
    GrantEbookEntitlementCommand.cs  → internal, triggered by OrderPaidEvent
  Queries/
    GetMyEbooksQuery.cs
    GetEbookDownloadUrlQuery.cs      → generate signed URL (15 phút)
```

### 5.2 Domain Events

```csharp
// Publish sau khi order được mark paid
public record OrderPaidEvent(Guid OrderId, Guid UserId, List<OrderItemDto> Items) : INotification;

// Handlers của OrderPaidEvent:
//   1. GenerateActivationCodesHandler  → tạo activation codes cho physical books
//   2. GrantEbookEntitlementsHandler   → cấp quyền ebook ngay lập tức
//   3. SendOrderConfirmationEmailHandler
//   4. UpdateOrderStatusHandler        → COMPLETED nếu toàn bộ là ebook
```

---

## 6. API Endpoints

### 6.1 Catalog (public)

```
GET  /api/books                     → list, filter: category, type, tag, price range, sort
GET  /api/books/{slug}              → book detail + resource mappings
GET  /api/books/recommended         → personalized / bestseller
GET  /api/books/categories          → category tree
GET  /api/books/search?q=           → full-text search
```

### 6.2 Cart (authenticated)

```
GET    /api/cart                    → get current cart
POST   /api/cart/items              → { bookId, quantity }
PUT    /api/cart/items/{bookId}     → { quantity }
DELETE /api/cart/items/{bookId}
POST   /api/cart/voucher            → { code } → apply voucher
DELETE /api/cart/voucher            → remove voucher
```

### 6.3 Checkout & Payment

```
POST /api/checkout                  → { paymentMethod, shippingAddress? }
                                       → returns { orderId, paymentUrl }

POST /api/payment/vnpay/callback    → VNPay IPN endpoint (unsigned, verify internally)
GET  /api/payment/vnpay/return      → redirect URL sau thanh toán
POST /api/payment/momo/callback     → MoMo IPN endpoint
GET  /api/payment/result?orderId=   → check order status (polling)
```

### 6.4 Orders

```
GET /api/orders                     → my orders (paginated)
GET /api/orders/{id}                → order detail + items
DELETE /api/orders/{id}/cancel      → cancel nếu status = PENDING/WAITING_PAYMENT
```

### 6.5 Activation

```
POST /api/activation/verify         → { code } → { valid, bookTitle, bookType }
POST /api/activation/activate       → { code } → activate + returns unlockedResources[]
GET  /api/activation/my-codes       → list user's activation codes
```

### 6.6 My Books

```
GET /api/my-books                   → all (physical + ebook, activated)
GET /api/my-books/ebooks            → only ebooks with entitlement
GET /api/my-books/ebooks/{bookId}/download-url  → signed S3 URL (15 min TTL)
```

### 6.7 Admin

```
GET|POST        /api/admin/books
GET|PUT|DELETE  /api/admin/books/{id}
POST            /api/admin/books/{id}/publish
POST            /api/admin/books/{id}/unpublish
GET|POST        /api/admin/books/{id}/resource-mappings
DELETE          /api/admin/books/{id}/resource-mappings/{mappingId}

GET|POST        /api/admin/vouchers
GET|PUT|DELETE  /api/admin/vouchers/{id}

GET             /api/admin/orders               → filter: status, date, userId
GET             /api/admin/orders/{id}
PUT             /api/admin/orders/{id}/status   → { status }

GET             /api/admin/activation-codes     → list by bookId/orderId
POST            /api/admin/activation-codes/generate-batch  → { bookId, quantity }
PUT             /api/admin/activation-codes/{id}/block
```

---

## 7. Payment Integration

### 7.1 VNPay

```csharp
// Flow:
// 1. CreatePaymentRequestCommand → build vnp_Params dict → HMAC-SHA512 → returnUrl
// 2. User redirect → thanh toán trên VNPay
// 3. VNPay gọi IPN: POST /api/payment/vnpay/callback
// 4. HandleVnpayCallbackCommand:
//    a. Verify vnp_SecureHash (HMAC-SHA512)
//    b. Check vnp_ResponseCode == "00"
//    c. Check amount match
//    d. Update Payment.Status = SUCCESS
//    e. Publish OrderPaidEvent

public class VnpayPaymentService
{
    private const string VERSION = "2.1.0";
    private const string COMMAND = "pay";
    private const string CURRENCY = "VND";
    private const string LOCALE = "vn";
    private const string ORDER_TYPE = "billpayment";

    public string CreatePaymentUrl(Order order, string ipAddr)
    {
        // Sort params alphabetically → HMAC-SHA512 → append vnp_SecureHash
        // Return sandbox/production URL
    }

    public bool ValidateCallback(IQueryCollection queryParams, out string responseCode)
    {
        // Extract vnp_SecureHash, remove it, sort remaining, HMAC-SHA512, compare
    }
}
```

### 7.2 MoMo

```csharp
// HMAC-SHA256 signature
// Fields: accessKey, amount, extraData, ipnUrl, orderId, orderInfo,
//         partnerCode, redirectUrl, requestId, requestType
public class MomoPaymentService
{
    public async Task<string> CreatePaymentUrl(Order order) { ... }
    public bool ValidateSignature(MomoCallbackDto callback) { ... }
}
```

### 7.3 Payment Method Selection

```
PaymentMethod enum:
  VNPay         → credit/debit card, internet banking
  MoMo          → ví điện tử
  QRBanking     → QR code ngân hàng (VNPay QR)
  BankTransfer  → chuyển khoản thủ công (admin confirm)
```

---

## 8. Event-Driven Design

```
OrderPaidEvent
    │
    ├──► GenerateActivationCodesHandler
    │       foreach (item in order.Items where item.BookType == Physical && IsActivationRequired)
    │           ActivationCode.Generate(bookId, orderId)  → save → send via email
    │
    ├──► GrantEbookEntitlementsHandler
    │       foreach (item in order.Items where item.BookType == Ebook)
    │           EbookEntitlement.Grant(userId, bookId, orderId) → save
    │
    ├──► SendOrderConfirmationEmailHandler
    │       Send email: order summary, activation codes, ebook download links
    │
    └──► CompleteOrderIfAllDigitalHandler
            if all items are Ebook → order.Status = Completed


BookActivatedEvent
    │
    └──► UnlockLmsResourcesHandler
            foreach (mapping in book.ResourceMappings)
                // Dispatch to LMS domain: enroll in course / grant asset access
                // Loose coupling: command to LMS, no direct dependency
```

---

## 9. Ebook Security

### 9.1 Signed URL Flow

```
User requests download
  → GET /api/my-books/ebooks/{bookId}/download-url
  → Verify EbookEntitlement.IsActive
  → Generate pre-signed S3/MinIO URL (TTL = 15 minutes)
  → Return { url, expiresAt }
  → Client downloads directly from S3

File key stored in books.file_key (internal, never exposed to frontend)
```

### 9.2 Anti-abuse

- Mỗi lần gọi tạo 1 URL mới, không cache URL phía server.
- Log mỗi lần generate URL (userId, bookId, ipAddress, timestamp).
- Rate limit: max 5 signed URL requests/hour/user/book.
- Optional Phase 2+: PDF watermark (user email + order code in footer).

---

## 10. Frontend — Pages & Components

### 10.1 Pages

| Route | Component | Mô tả |
|---|---|---|
| `/sach` | `BookCatalogPage` | Grid sách, filter sidebar, search |
| `/sach/[slug]` | `BookDetailPage` | Chi tiết, resources, add to cart |
| `/gio-hang` | `CartPage` | Cart items, voucher, total, checkout CTA |
| `/thanh-toan` | `CheckoutPage` | Địa chỉ giao hàng, phương thức TT |
| `/thanh-toan/ket-qua` | `PaymentResultPage` | Success/failure, order summary |
| `/don-hang` | `MyOrdersPage` | Danh sách đơn hàng |
| `/don-hang/[id]` | `OrderDetailPage` | Chi tiết đơn, tracking status |
| `/kich-hoat` | `ActivationPage` | Form nhập mã kích hoạt |
| `/thu-vien-sach` | `MyBooksPage` | Ebook library + physical activated |
| `/admin/sach` | `AdminBooksPage` | CRUD sách |
| `/admin/don-hang` | `AdminOrdersPage` | Quản lý đơn hàng |

### 10.2 Components

```
components/
  books/
    BookCard.tsx               → thumbnail, title, price, type badge, add-to-cart
    BookGrid.tsx               → responsive grid
    BookFilters.tsx            → category tree, price range, type, tags
    BookDetailHero.tsx         → large view: cover, info, CTA
    BookResourceList.tsx       → linked courses/videos/quizzes
    PriceBadge.tsx             → giá gốc / giá sale + countdown

  cart/
    CartItem.tsx
    CartSummary.tsx            → subtotal, discount, total
    VoucherInput.tsx
    CartDrawer.tsx             → slide-in từ phải (quick cart)

  checkout/
    ShippingAddressForm.tsx
    PaymentMethodSelector.tsx  → VNPay / MoMo / QR cards
    OrderSummaryPanel.tsx

  orders/
    OrderCard.tsx
    OrderStatusBadge.tsx       → màu theo trạng thái
    OrderTimeline.tsx          → status history

  activation/
    ActivationCodeInput.tsx    → auto-format XXXX-XXXX-XXXX-XXXX
    ActivationResult.tsx       → unlocked resources list

  mybooks/
    EbookCard.tsx              → cover, download button, read button
    PhysicalBookCard.tsx       → cover, activation status
    DownloadButton.tsx         → gọi API lấy signed URL rồi download
```

### 10.3 RTK Query slices

```
features/
  books/
    booksApi.ts                → getBooks, getBookBySlug, getRecommended
  cart/
    cartApi.ts                 → getCart, addItem, updateItem, removeItem, applyVoucher
  orders/
    ordersApi.ts               → getOrders, getOrder, cancelOrder
  payment/
    paymentApi.ts              → createCheckout, getPaymentResult
  activation/
    activationApi.ts           → verify, activate
  mybooks/
    mybooksApi.ts              → getMyBooks, getEbookDownloadUrl
```

---

## 11. Phase Plan & Task Breakdown

### Phase 1 — Core Commerce (4 tuần)
> **Goal:** User có thể duyệt sách, thêm vào giỏ, thanh toán, xem đơn hàng.

---

#### Sprint 1.1 — Database & Catalog (Tuần 1)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 1.1.1 | ✅ Tạo SQL migration: `books`, `book_categories`, `book_resource_mappings` | P0 | 1h |
| 1.1.2 | ✅ Domain entities: `Book`, `BookCategory`, `BookResourceMapping` | P0 | 3h |
| 1.1.3 | ✅ EF Core configurations + DbContext registration | P0 | 2h |
| 1.1.4 | ✅ Application: `GetBooksQuery`, `GetBookBySlugQuery` | P0 | 3h |
| 1.1.5 | ✅ `BooksController`: `GET /api/books`, `GET /api/books/{slug}` | P0 | 2h |
| 1.1.6 | ✅ Frontend: `BookCard`, `BookGrid` components | P1 | 4h |
| 1.1.7 | ✅ Frontend: `/sach` page với filter + pagination | P1 | 4h |
| 1.1.8 | ✅ Frontend: `/sach/[slug]` book detail page | P1 | 4h |
| 1.1.9 | ✅ Admin: Seed 5–10 sách mẫu để test | P1 | 1h |

---

#### Sprint 1.2 — Cart & Voucher (Tuần 2)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 1.2.1 | Migration: `carts`, `cart_items`, `vouchers` | P0 | 1h |
| 1.2.2 | Domain entities: `Cart`, `CartItem`, `Voucher` | P0 | 3h |
| 1.2.3 | Commands: `AddToCartCommand`, `UpdateCartItemCommand`, `RemoveCartItemCommand` | P0 | 4h |
| 1.2.4 | `ApplyVoucherCommand` (validate + calculate discount) | P1 | 3h |
| 1.2.5 | `CartController` CRUD endpoints | P0 | 2h |
| 1.2.6 | ✅ Frontend: `CartPage` + `CartDrawer` slide-in (Redux-based, local state) | P1 | 5h |
| 1.2.7 | Frontend: `VoucherInput` + hiển thị discount | P1 | 2h |
| 1.2.8 | Cart validation: không cho mua ebook trùng (check `ebook_entitlements`) | P0 | 2h |

---

#### Sprint 1.3 — Checkout & VNPay (Tuần 3)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 1.3.1 | ✅ Migration: `orders`, `order_items` | P0 | 1h |
| 1.3.2 | ✅ Domain entities: `Order`, `OrderItem` (Payment deferred to 1.3.4) | P0 | 4h |
| 1.3.3 | ✅ `CreateCheckoutCommand` (cart → pending order) | P0 | 4h |
| 1.3.4 | `VnpayPaymentService` (create URL + verify callback) | P0 | 5h |
| 1.3.5 | `HandleVnpayCallbackCommand` + publish `OrderPaidEvent` | P0 | 3h |
| 1.3.6 | ✅ `CheckoutController`, `OrdersController` (GET/CANCEL) | P0 | 2h |
| 1.3.7 | ✅ Frontend: `CheckoutPage` (địa chỉ giao hàng + chọn TT) | P1 | 5h |
| 1.3.8 | ✅ Frontend: `PaymentResultPage` (success/failure) | P1 | 3h |
| 1.3.9 | Test end-to-end: VNPay sandbox | P0 | 2h |

---

#### Sprint 1.4 — Orders & Frontend Polish (Tuần 4)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 1.4.1 | ✅ `GetMyOrdersQuery`, `GetOrderByIdQuery` | P0 | 2h |
| 1.4.2 | ✅ `CancelOrderCommand` (chỉ khi PENDING/WAITING_PAYMENT) | P1 | 2h |
| 1.4.3 | ✅ `OrdersController` endpoints | P0 | 1h |
| 1.4.4 | ✅ Frontend: `MyOrdersPage` + `OrderDetailPage` | P1 | 5h |
| 1.4.5 | ✅ Frontend: `OrderStatusBadge` + status màu sắc | P1 | 1h |
| 1.4.6 | ✅ RTK Query slices: booksApi, ordersApi (cartApi = Redux local state) | P0 | 4h |
| 1.4.7 | Frontend: Header — Cart icon + item count badge | P1 | 2h |
| 1.4.8 | Integration testing Phase 1 | P0 | 3h |

**Phase 1 deliverable:** User mua được sách (physical + ebook), thanh toán VNPay, xem lịch sử đơn hàng.

---

### Phase 2 — Ebook & Activation (3 tuần)
> **Goal:** User nhận ebook ngay sau khi mua, nhập mã kích hoạt để mở tài nguyên LMS.

---

#### Sprint 2.1 — Ebook Entitlement (Tuần 5)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 2.1.1 | ✅ Migration: `ebook_entitlements` | P0 | 0.5h |
| 2.1.2 | ✅ Domain entity: `EbookEntitlement` | P0 | 2h |
| 2.1.3 | ✅ `GrantEbookEntitlementsHandler` (handles `OrderPaidEvent`) | P0 | 3h |
| 2.1.4 | ✅ `GetMyEbooksQuery` | P0 | 2h |
| 2.1.5 | `GetEbookDownloadUrlQuery` (MinIO pre-signed URL, TTL 15 min) | P0 | 3h |
| 2.1.6 | ✅ `MyBooksController` endpoints | P0 | 1h |
| 2.1.7 | MinIO/S3 service: upload ebook file, generate signed URL | P0 | 4h |
| 2.1.8 | Rate limiting: max 5 download URL requests/hour/book | P1 | 2h |

---

#### Sprint 2.2 — Activation Codes (Tuần 6)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 2.2.1 | ✅ Migration: `activation_codes` | P0 | 0.5h |
| 2.2.2 | ✅ Domain entity: `ActivationCode` | P0 | 2h |
| 2.2.3 | ✅ `GenerateActivationCodesHandler` (handles `OrderPaidEvent`) | P0 | 3h |
| 2.2.4 | ✅ `VerifyActivationCodeCommand` | P0 | 2h |
| 2.2.5 | ✅ `ActivateCodeCommand` → kích hoạt code + dispatch LMS unlock | P0 | 3h |
| 2.2.6 | `UnlockLmsResourcesHandler` (enroll course / grant video access) | P1 | 4h |
| 2.2.7 | ✅ `ActivationController` endpoints | P0 | 1h |
| 2.2.8 | Email: gửi activation codes sau khi order paid | P1 | 3h |

---

#### Sprint 2.3 — My Books UI (Tuần 7)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 2.3.1 | ✅ Frontend: `MyBooksPage` (`/thu-vien-sach` — ebooks + download) | P1 | 5h |
| 2.3.2 | ✅ Frontend: `EbookCard` + `DownloadButton` (direct fileUrl) | P1 | 3h |
| 2.3.3 | ✅ Frontend: `/kich-hoat` page + `ActivationCodeInput` (auto-format) | P1 | 4h |
| 2.3.4 | ✅ Frontend: `ActivationResult` (success state with book info) | P1 | 3h |
| 2.3.5 | ✅ Frontend: RTK Query slices mybooksApi, activationApi | P0 | 2h |
| 2.3.6 | ✅ BookSubNav: link "Thư viện sách" → `/thu-vien-sach` | P1 | 1h |
| 2.3.7 | Integration testing Phase 2 | P0 | 3h |

**Phase 2 deliverable:** Ebook unlock tự động, mã kích hoạt được gửi email, user kích hoạt mở course/video.

---

### Phase 3 — Admin & Vouchers (2 tuần)
> **Goal:** Admin quản lý đầy đủ sách, đơn hàng, voucher. CMS tích hợp homepage.

---

#### Sprint 3.1 — Admin Panel (Tuần 8)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 3.1.1 | `BookAdminController` CRUD + publish/unpublish | P0 | 4h |
| 3.1.2 | `CreateBookCommand`, `UpdateBookCommand`, `DeleteBookCommand` | P0 | 4h |
| 3.1.3 | `AddResourceMappingCommand`, API endpoint | P1 | 3h |
| 3.1.4 | Frontend: `/admin/sach` — DataTable + CRUD form | P1 | 8h |
| 3.1.5 | Frontend: Resource mapping UI (link book ↔ course/video) | P1 | 4h |
| 3.1.6 | Admin: batch generate activation codes | P1 | 3h |

---

#### Sprint 3.2 — Vouchers & Orders Admin (Tuần 9)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 3.2.1 | `VoucherController` CRUD admin | P0 | 3h |
| 3.2.2 | Frontend: `/admin/vouchers` CRUD | P1 | 4h |
| 3.2.3 | `OrderAdminController` list + detail + status update | P0 | 3h |
| 3.2.4 | Frontend: `/admin/don-hang` with filters | P1 | 5h |
| 3.2.5 | CMS: `BookCarousel` component cho homepage (`/`) | P2 | 4h |
| 3.2.6 | CMS: Bestseller section + Recommended books section | P2 | 3h |
| 3.2.7 | Email template: order confirmation + ebook links | P1 | 3h |

**Phase 3 deliverable:** Admin vận hành đủ, homepage có sections sách.

---

### Phase 4 — Advanced Features (2 tuần)
> **Goal:** MoMo payment, reviews, analytics, combo pricing.

---

#### Sprint 4.1 — MoMo & Analytics (Tuần 10)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 4.1.1 | `MomoPaymentService` + callback handler | P1 | 5h |
| 4.1.2 | Frontend: MoMo option trong PaymentMethodSelector | P1 | 1h |
| 4.1.3 | Book review system: `BookReview` entity, APIs | P2 | 5h |
| 4.1.4 | Frontend: review form + rating display trong BookDetailPage | P2 | 4h |

---

#### Sprint 4.2 — Combo & Recommendations (Tuần 11)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 4.2.1 | Combo pricing: `ComboItems` table, combo discount logic | P2 | 4h |
| 4.2.2 | Frontend: Combo product page | P2 | 4h |
| 4.2.3 | Recommendation: "Mua cùng" / "Xem nhiều" sections | P2 | 3h |
| 4.2.4 | Analytics: top selling books, revenue by period (admin) | P2 | 4h |
| 4.2.5 | Smoke test toàn bộ module + performance check | P0 | 4h |

**Phase 4 deliverable:** Full feature commerce module production-ready.

---

### Tổng timeline

```
Tuần 1   ████████████ Catalog (books, categories, API, frontend)
Tuần 2   ████████████ Cart + Voucher
Tuần 3   ████████████ Checkout + VNPay Payment
Tuần 4   ████████████ Orders + Frontend polish + Phase 1 integration test
─────────────────────────── Phase 1 MVP Done ───────────────────────────
Tuần 5   ████████████ Ebook Entitlement + S3 signed URL
Tuần 6   ████████████ Activation Codes + LMS resource unlock
Tuần 7   ████████████ My Books UI + Activation UI
─────────────────────────── Phase 2 Done ───────────────────────────────
Tuần 8   ████████████ Admin Panel (books CRUD)
Tuần 9   ████████████ Vouchers + Orders Admin + CMS
─────────────────────────── Phase 3 Done ───────────────────────────────
Tuần 10  ████████████ MoMo + Book Reviews
Tuần 11  ████████████ Combo + Recommendations + Final QA
─────────────────────────── Phase 4 Done ───────────────────────────────

Tổng: ~11 tuần (1 dev full-stack)
      ~7 tuần  (2 devs, backend + frontend song song từ Phase 2)
```

---

## 12. Definition of Done

Mỗi task được coi là **Done** khi:

- [ ] Code implement xong, không có compile error
- [ ] Unit test hoặc integration test pass cho happy path + error cases chính
- [ ] API endpoint test với Postman/`.http` file
- [ ] Frontend render đúng trên Chrome (desktop 1280px + mobile 375px)
- [ ] Không có TypeScript errors (`tsc --noEmit` pass)
- [ ] Không có N+1 query (EF Core, dùng Include hoặc projection)
- [ ] Không expose internal data (file_key, payment secrets, raw gateway responses) ra client

### Security checklist mỗi payment endpoint:

- [ ] Verify HMAC signature của gateway callback
- [ ] Idempotency check (không process cùng 1 transaction_id 2 lần)
- [ ] Amount double-check (server-side, không trust client amount)
- [ ] RBAC: admin endpoints yêu cầu role `BOOK_ADMIN` hoặc `ORDER_ADMIN`
- [ ] Signed URL cho ebook: verify entitlement trước khi generate, log audit trail

---

*Tài liệu này là living document — cập nhật theo từng sprint.*

---

## Phase 5 — Course Commerce & Invoice System

**Ngày thiết kế:** 21/05/2026  
**Mục tiêu:**
1. Hợp nhất luồng mua hàng: người dùng có thể mua **khóa học trả phí** qua đúng flow Cart → Checkout → Payment như sách.
2. Sinh **hóa đơn (Invoice) PDF** cho mọi đơn hàng đã thanh toán — cả sách lẫn khóa học.

---

### 5.1 Phân tích hiện trạng

#### 5.1.1 Những gì đã có

| Thành phần | Trạng thái |
|---|---|
| `Course.Price`, `Course.DiscountPrice`, `Course.IsFree` | ✅ Entity sẵn có |
| `CourseEnrollment.OrderId`, `CourseEnrollment.Source` | ✅ Sẵn sàng liên kết với order |
| `Order`, `OrderItem`, `Payment` flow | ✅ Đầy đủ cho Book |
| `MomoPaymentService`, `ConfirmOrderPaymentByCodeCommand` | ✅ Phase 4 |
| `EbookEntitlement` (unlock sau thanh toán) | ✅ Analogy cho Course enrollment |

#### 5.1.2 Những gì cần bổ sung

| Gap | Giải pháp |
|---|---|
| `OrderItem` chỉ có `BookId` | Thêm `ItemType` + `CourseId` (nullable) |
| Không có trang "Mua khóa học" | Nút CTA trên Course detail, course vào cart |
| Cart chỉ chứa sách | Cart item hỗ trợ `BookId` hoặc `CourseId` |
| Không sinh tự động enrollment từ order | Handler `GrantCourseEnrollmentHandler` |
| Không có Invoice entity | Thêm `Invoice` entity + PDF generation |
| Không có endpoint download hóa đơn | `GET /api/orders/{id}/invoice` |

---

### 5.2 Database Changes

#### 5.2.1 Mở rộng `OrderItems`

```sql
-- Migration: phase5-migration.sql
ALTER TABLE tenant_demo."OrderItems"
    ADD COLUMN IF NOT EXISTS "ItemType"  VARCHAR(20) NOT NULL DEFAULT 'Book',
    ADD COLUMN IF NOT EXISTS "CourseId"  UUID NULL REFERENCES tenant_demo."Courses"("Id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "IX_OrderItems_CourseId"
    ON tenant_demo."OrderItems" ("CourseId") WHERE "CourseId" IS NOT NULL;
```

> `ItemType` ∈ `{ Book, Course }` — mở rộng sau: `Bundle`, `Subscription`.

#### 5.2.2 Bảng `Invoices`

```sql
CREATE TABLE IF NOT EXISTS tenant_demo."Invoices" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "OrderId"        UUID NOT NULL REFERENCES tenant_demo."Orders"("Id") ON DELETE CASCADE,
    "InvoiceNumber"  VARCHAR(30) NOT NULL,          -- INV-yyyyMMdd-XXXXX
    "IssuedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "BuyerName"      VARCHAR(200),
    "BuyerEmail"     VARCHAR(200),
    "BuyerPhone"     VARCHAR(20),
    "BuyerAddress"   VARCHAR(500),
    "BuyerTaxCode"   VARCHAR(50),                   -- mã số thuế (nếu xuất VAT)
    "TotalAmount"    NUMERIC(18,2) NOT NULL,
    "DiscountAmount" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "FinalAmount"    NUMERIC(18,2) NOT NULL,
    "VatAmount"      NUMERIC(18,2) NOT NULL DEFAULT 0,
    "Notes"          TEXT,
    "PdfUrl"         VARCHAR(1000),                 -- URL lưu file PDF (MinIO/S3)
    "CreatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Invoices_OrderId" UNIQUE ("OrderId"),
    CONSTRAINT "UQ_Invoices_InvoiceNumber" UNIQUE ("InvoiceNumber")
);

CREATE INDEX IF NOT EXISTS "IX_Invoices_OrderId" ON tenant_demo."Invoices" ("OrderId");
```

---

### 5.3 Domain Entities

#### 5.3.1 Cập nhật `OrderItem`

```csharp
// MLS.Domain/Entities/OrderItem.cs — bổ sung
public enum OrderItemType { Book, Course }

public class OrderItem : BaseEntity
{
    // ... existing fields ...
    public OrderItemType ItemType   { get; private set; } = OrderItemType.Book;
    public Guid?         CourseId   { get; private set; }   // set khi ItemType = Course
    public string?       CourseSlug { get; private set; }

    // Factory cho course item
    public static OrderItem CreateCourseItem(
        Guid orderId, Guid courseId, string courseTitle, string? courseSlug,
        decimal unitPrice, string? coverColor = null, string? coverEmoji = null)
        => new()
        {
            Id         = Guid.NewGuid(),
            OrderId    = orderId,
            ItemType   = OrderItemType.Course,
            CourseId   = courseId,
            CourseSlug = courseSlug,
            BookTitle  = courseTitle,   // reuse BookTitle field as "ItemTitle"
            BookType   = "Course",
            UnitPrice  = unitPrice,
            Quantity   = 1,
            TotalPrice = unitPrice,
            CreatedAt  = DateTime.UtcNow,
            UpdatedAt  = DateTime.UtcNow,
            CoverColor = coverColor,
            CoverEmoji = coverEmoji ?? "🎓",
        };
}
```

> **Lý do reuse BookTitle/BookType fields:** Không cần thêm cột mới, backward-compatible với dữ liệu cũ. `ItemTitle` được dùng trong invoice và display — đổi tên nếu refactor sau.

#### 5.3.2 `Invoice` Entity

```csharp
// MLS.Domain/Entities/Invoice.cs
public class Invoice : BaseEntity
{
    public Guid     OrderId       { get; private set; }
    public string   InvoiceNumber { get; private set; } = string.Empty; // INV-yyyyMMdd-XXXXX
    public DateTime IssuedAt      { get; private set; }
    public string?  BuyerName     { get; private set; }
    public string?  BuyerEmail    { get; private set; }
    public string?  BuyerPhone    { get; private set; }
    public string?  BuyerAddress  { get; private set; }
    public string?  BuyerTaxCode  { get; private set; }
    public decimal  TotalAmount   { get; private set; }
    public decimal  DiscountAmount{ get; private set; }
    public decimal  FinalAmount   { get; private set; }
    public decimal  VatAmount     { get; private set; }
    public string?  Notes         { get; private set; }
    public string?  PdfUrl        { get; private set; }

    public Order Order { get; private set; } = null!;

    private Invoice() { }

    public static Invoice Create(Guid orderId, string buyerName, string buyerEmail,
        decimal total, decimal discount, decimal final, decimal vat = 0,
        string? buyerPhone = null, string? buyerAddress = null, string? taxCode = null)
        => new()
        {
            Id            = Guid.NewGuid(),
            OrderId       = orderId,
            InvoiceNumber = GenerateNumber(),
            IssuedAt      = DateTime.UtcNow,
            BuyerName     = buyerName,
            BuyerEmail    = buyerEmail,
            BuyerPhone    = buyerPhone,
            BuyerAddress  = buyerAddress,
            BuyerTaxCode  = taxCode,
            TotalAmount   = total,
            DiscountAmount= discount,
            FinalAmount   = final,
            VatAmount     = vat,
            CreatedAt     = DateTime.UtcNow,
        };

    public void SetPdfUrl(string url) => PdfUrl = url;

    private static string GenerateNumber()
        => $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}";
}
```

---

### 5.4 Application Layer

#### 5.4.1 Commands & Queries mới

```
Orders/Commands/
  CreateCheckoutCommand.cs        ✏️ UPDATED — hỗ trợ CourseItems
  GrantCourseEnrollmentHandler.cs 🆕 handles OrderPaidEvent → tạo CourseEnrollment

Invoice/
  Commands/
    GenerateInvoiceCommand.cs     🆕 tạo Invoice record + render PDF
  Queries/
    GetInvoiceByOrderQuery.cs     🆕 trả về Invoice data
    DownloadInvoicePdfQuery.cs    🆕 trả về binary PDF hoặc pre-signed URL
```

#### 5.4.2 `GrantCourseEnrollmentHandler` (handles `OrderPaidEvent`)

```csharp
// MLS.Application/Orders/Events/GrantCourseEnrollmentHandler.cs
public class GrantCourseEnrollmentHandler : INotificationHandler<OrderPaidEvent>
{
    public async Task Handle(OrderPaidEvent notification, CancellationToken ct)
    {
        var courseItems = notification.Items
            .Where(i => i.ItemType == OrderItemType.Course && i.CourseId.HasValue);

        foreach (var item in courseItems)
        {
            var alreadyEnrolled = await db.CourseEnrollments
                .AnyAsync(e => e.UserId == notification.UserId && e.CourseId == item.CourseId, ct);

            if (!alreadyEnrolled)
            {
                var enrollment = CourseEnrollment.Create(
                    notification.UserId,
                    item.CourseId!.Value,
                    EnrollmentSource.Payment,
                    orderId: notification.OrderId);

                db.CourseEnrollments.Add(enrollment);
            }
        }
        await db.SaveChangesAsync(ct);
    }
}
```

#### 5.4.3 `GenerateInvoiceCommand`

```csharp
// MLS.Application/Invoice/Commands/GenerateInvoiceCommand.cs
public record GenerateInvoiceCommand(Guid OrderId, string? BuyerTaxCode = null) : IRequest<InvoiceDto>;

// Handler:
// 1. Load Order + Items + User profile
// 2. Check order.PaymentStatus == Paid (chỉ tạo invoice cho đơn đã thanh toán)
// 3. Upsert Invoice record (idempotent — nếu đã tồn tại thì trả về existing)
// 4. Render HTML template → wkhtmltopdf / QuestPDF → binary PDF
// 5. Upload PDF lên MinIO/S3 → lấy signed URL (TTL 1 giờ)
// 6. Update Invoice.PdfUrl
// 7. Return InvoiceDto { invoiceNumber, issuedAt, pdfUrl }
```

> **PDF Library ưu tiên:** [QuestPDF](https://www.questpdf.com/) (NuGet: `QuestPDF`) — .NET native, không cần wkhtmltopdf binary, license MIT cho dự án thương mại < 1M USD/năm.

#### 5.4.4 `InvoiceDto`

```csharp
public record InvoiceDto(
    Guid     Id,
    Guid     OrderId,
    string   InvoiceNumber,
    DateTime IssuedAt,
    string?  BuyerName,
    string?  BuyerEmail,
    string?  BuyerAddress,
    string?  BuyerTaxCode,
    decimal  TotalAmount,
    decimal  DiscountAmount,
    decimal  FinalAmount,
    decimal  VatAmount,
    string?  PdfUrl,
    List<InvoiceLineDto> Lines
);

public record InvoiceLineDto(
    string   Description,   // Tiêu đề sách/khóa học
    string   ItemType,      // Book | Course
    int      Quantity,
    decimal  UnitPrice,
    decimal  TotalPrice
);
```

---

### 5.5 API Endpoints

#### 5.5.1 Checkout — hỗ trợ Course items

```
POST /api/v1/checkout
Body (extended):
{
  "items": [
    {
      "bookId": "...",           // Book item (như cũ)
      "title": "Tiếng Việt C1",
      "type": "Ebook",
      "unitPrice": 150000,
      "quantity": 1,
      ...
    },
    {
      "courseId": "...",         // Course item (MỚI)
      "itemType": "Course",      // phân biệt với book
      "title": "Khóa IELTS 7.0",
      "unitPrice": 2500000,
      "quantity": 1,
      "slug": "khoa-ielts-7-0",
      "coverEmoji": "🎓"
    }
  ],
  "paymentMethod": "MoMo",
  ...
}
```

#### 5.5.2 Courses — thêm endpoint mua khóa học

```
GET  /api/v1/courses/{slug}            (đã có) — thêm field: isPurchased, price, discountPrice
POST /api/v1/cart/courses              🆕 — thêm khóa học vào cart
                                           Body: { courseId }
```

> Hoặc đơn giản hơn: frontend gọi trực tiếp `POST /api/v1/checkout` với `courseId` khi user bấm "Mua ngay" (bỏ qua cart cho single-item checkout).

#### 5.5.3 Invoice endpoints

```
POST /api/v1/orders/{id}/invoice       🆕 — tạo/lấy invoice (generate nếu chưa có)
                                           Body: { buyerTaxCode? }
                                           → 201 với InvoiceDto

GET  /api/v1/orders/{id}/invoice       🆕 — lấy invoice metadata
GET  /api/v1/orders/{id}/invoice/pdf   🆕 — redirect/stream PDF file
                                           → 302 redirect sang pre-signed S3 URL

POST /api/v1/admin/orders/{id}/invoice 🆕 — admin tạo invoice thủ công
GET  /api/v1/admin/invoices            🆕 — admin list invoices (filter: date, status)
```

---

### 5.6 Frontend Changes

#### 5.6.1 Course Detail Page — thêm mua khóa học

File: `frontend/src/app/khoa-hoc/[slug]/page.tsx` *(đã tồn tại)*

Bổ sung:
- `isPurchased` flag từ API → nếu đã mua thì hiện "Vào học" thay vì "Mua khóa học"
- `price`, `discountPrice` → hiển thị bảng giá, badge "Tiết kiệm X%"
- Nút **"Mua ngay"** → gọi `POST /api/v1/checkout` với course item → redirect sang trang thanh toán
- Nút **"Thêm vào giỏ"** → thêm course item vào Redux cart

```tsx
// Thêm vào CourseDetailPage
{!course.isFree && !isPurchased && (
  <div className="bg-white rounded-2xl border p-5 space-y-3">
    <div className="flex items-baseline gap-2">
      {course.discountPrice ? (
        <>
          <span className="text-3xl font-black" style={{ color: "#e5173f" }}>
            {course.discountPrice.toLocaleString("vi-VN")}đ
          </span>
          <span className="line-through text-gray-400 text-lg">
            {course.price.toLocaleString("vi-VN")}đ
          </span>
        </>
      ) : (
        <span className="text-3xl font-black" style={{ color: "#e5173f" }}>
          {course.price.toLocaleString("vi-VN")}đ
        </span>
      )}
    </div>
    <button onClick={handleBuyNow} className="w-full rounded-xl py-3 text-white font-bold"
      style={{ backgroundColor: "#0a2540" }}>
      Mua ngay
    </button>
    <button onClick={handleAddToCart} className="w-full rounded-xl py-3 border-2 font-bold"
      style={{ borderColor: "#0a2540", color: "#0a2540" }}>
      Thêm vào giỏ hàng
    </button>
  </div>
)}
{isPurchased && (
  <Link href={`/khoa-hoc/${course.slug}/hoc`}
    className="block w-full text-center rounded-xl py-3 text-white font-bold"
    style={{ backgroundColor: "#0a2540" }}>
    Vào học ngay →
  </Link>
)}
```

#### 5.6.2 Cart — hỗ trợ Course items

File: `frontend/src/lib/features/cart/cartSlice.ts` *(đã tồn tại)*

```typescript
export interface CartItem {
  id:         string;
  itemType:   "Book" | "Course";   // 🆕
  courseId?:  string;              // 🆕 set khi itemType = Course
  bookId?:    string;
  title:      string;
  type:       string;              // "Ebook" | "PhysicalBook" | "Course"
  unitPrice:  number;
  quantity:   number;
  slug?:      string;
  coverColor?: string;
  coverEmoji?: string;
  coverUrl?:  string;
}
```

`CheckoutPage` gửi items với `courseId` khi `itemType === "Course"`.

#### 5.6.3 Order Detail — nút tải hóa đơn

File: `frontend/src/app/don-hang/[id]/page.tsx` + `frontend/src/app/admin/don-hang/[id]/page.tsx`

```tsx
// Hiển thị khi order.paymentStatus === "Paid"
{order.paymentStatus === "Paid" && (
  <button
    onClick={async () => {
      const res = await fetch(`/api/v1/orders/${order.id}/invoice/pdf`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-Slug": "demo" }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HoaDon-${order.orderCode}.pdf`;
      a.click();
    }}
    className="flex items-center gap-2 rounded-xl px-4 py-2 border text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Tải hóa đơn PDF
  </button>
)}
```

#### 5.6.4 RTK Query — Invoice API

```typescript
// frontend/src/lib/features/orders/invoiceApi.ts  🆕
export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: baseQueryWithTenant("/api/v1"),
  endpoints: (builder) => ({
    generateInvoice: builder.mutation<InvoiceDto, { orderId: string; buyerTaxCode?: string }>({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/invoice`,
        method: "POST",
        body,
      }),
    }),
    getInvoice: builder.query<InvoiceDto, string>({
      query: (orderId) => `/orders/${orderId}/invoice`,
    }),
  }),
});
```

---

### 5.7 PDF Invoice Template (QuestPDF)

```
┌─────────────────────────────────────────────────────┐
│  [Logo MLS]          HÓA ĐƠN THANH TOÁN            │
│                      Số: INV-20260521-AB3F2         │
│                      Ngày: 21/05/2026               │
├─────────────────────────────────────────────────────┤
│  Người mua: Nguyễn Văn A                           │
│  Email: nguyen@example.com                          │
│  Địa chỉ: 123 Nguyễn Huệ, TP.HCM                  │
│  MST: 0123456789 (nếu có)                           │
├─────────────────────────────────────────────────────┤
│  STT │ Mô tả                   │ SL │ Đơn giá │ TT │
│   1  │ 📘 Tiếng Việt C1 (Ebook)│  1 │ 150,000 │ 150,000 │
│   2  │ 🎓 Khóa IELTS 7.0       │  1 │ 2,500,000 │ 2,500,000 │
├─────────────────────────────────────────────────────┤
│                      Tổng tiền:  2,650,000đ        │
│                      Giảm giá:       -0đ           │
│                      Thanh toán: 2,650,000đ        │
│  Phương thức: MoMo · Mã đơn: MLS20260521-AB3F2    │
└─────────────────────────────────────────────────────┘
```

---

### 5.8 Sprint Breakdown

#### Sprint 5.1 — Course Commerce Backend (Tuần 12)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 5.1.1 | Migration: thêm `ItemType`, `CourseId`, `CourseSlug` vào `OrderItems` | P0 | 0.5h |
| 5.1.2 | Cập nhật `OrderItem` entity + EF config + `CreateCourseItem()` factory | P0 | 2h |
| 5.1.3 | Cập nhật `CreateCheckoutCommandHandler` nhận `courseId` trong items | P0 | 3h |
| 5.1.4 | `GrantCourseEnrollmentHandler` — handles `OrderPaidEvent` cho course items | P0 | 2h |
| 5.1.5 | Cập nhật `BooksController.GetBook` → trả thêm `isPurchased` cho course | P1 | 1h |
| 5.1.6 | Cập nhật `CoursesController.GetCourse` → trả thêm `isPurchased`, `price`, `discountPrice` | P0 | 2h |
| 5.1.7 | Unit test: checkout với course item → enrollment được tạo sau khi confirm payment | P0 | 2h |

#### Sprint 5.2 — Invoice System Backend (Tuần 12–13)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 5.2.1 | Migration: bảng `Invoices` | P0 | 0.5h |
| 5.2.2 | Domain entity `Invoice` + EF config | P0 | 2h |
| 5.2.3 | Add `QuestPDF` NuGet package vào `MLS.Infrastructure` | P0 | 0.5h |
| 5.2.4 | `InvoiceTemplateDocument` (QuestPDF) — render template theo thiết kế 5.7 | P1 | 4h |
| 5.2.5 | `GenerateInvoiceCommandHandler` — tạo Invoice + render PDF + upload MinIO | P0 | 4h |
| 5.2.6 | `GetInvoiceByOrderQuery` | P0 | 1h |
| 5.2.7 | `InvoiceController` — POST + GET + GET/pdf endpoints | P0 | 2h |
| 5.2.8 | Admin: `AdminInvoiceController` — list invoices, download | P1 | 2h |
| 5.2.9 | Hook vào `OrderPaidEvent`: tự động generate invoice khi order được xác nhận | P1 | 1h |

#### Sprint 5.3 — Frontend (Tuần 13)

| # | Task | Ưu tiên | Est |
|---|---|---|---|
| 5.3.1 | Cập nhật `CartItem` interface hỗ trợ `itemType: "Course"` + `courseId` | P0 | 1h |
| 5.3.2 | Cập nhật `CheckoutPage` — serialize course items đúng format | P0 | 2h |
| 5.3.3 | Course detail page: hiển thị giá + nút Mua/Vào học | P0 | 4h |
| 5.3.4 | `invoiceApi.ts` RTK Query slice | P0 | 1h |
| 5.3.5 | Nút "Tải hóa đơn PDF" trong `/don-hang/[id]` (user) | P1 | 2h |
| 5.3.6 | Nút "Tải hóa đơn PDF" trong `/admin/don-hang/[id]` (admin) | P1 | 1h |
| 5.3.7 | "Khóa học đã mua" tab trong `/tai-khoan` hoặc `/thu-vien-sach` | P2 | 3h |
| 5.3.8 | E2E test: mua khóa học → enrollment → vào học | P0 | 2h |

---

### 5.9 Lưu ý kỹ thuật quan trọng

#### A. Idempotency Invoice

```csharp
// GenerateInvoiceCommandHandler — upsert pattern
var existing = await db.Invoices.FirstOrDefaultAsync(i => i.OrderId == request.OrderId, ct);
if (existing is not null) return MapToDto(existing); // trả về invoice cũ, không tạo mới
```

#### B. Kiểm tra trước khi mua khóa học

```csharp
// Trong CreateCheckoutCommandHandler — kiểm tra course items
foreach (var courseItem in courseItems)
{
    // 1. Course phải Published
    var course = await db.Courses.FindAsync(courseItem.CourseId, ct)
        ?? throw new KeyNotFoundException($"Course {courseItem.CourseId} not found.");
    if (course.Status != CourseStatus.Published)
        throw new InvalidOperationException($"Khóa học '{course.Title}' chưa được phát hành.");

    // 2. Không cho mua nếu đã enrolled
    var enrolled = await db.CourseEnrollments
        .AnyAsync(e => e.UserId == request.UserId && e.CourseId == courseItem.CourseId, ct);
    if (enrolled) throw new InvalidOperationException($"Bạn đã có khóa học '{course.Title}'.");

    // 3. Price match (chống client giả giá)
    var serverPrice = course.DiscountPrice ?? course.Price;
    if (Math.Abs(courseItem.UnitPrice - serverPrice) > 0.01m)
        throw new InvalidOperationException("Giá khóa học không hợp lệ.");
}
```

#### C. QuestPDF MinIO-less Fallback

Nếu MinIO chưa được cấu hình, trả về PDF stream trực tiếp qua response thay vì upload:

```csharp
// InvoiceController — nếu không có IFileStorageService
var pdfBytes = invoiceRenderer.Render(invoiceData);
return File(pdfBytes, "application/pdf", $"HoaDon-{order.OrderCode}.pdf");
```

#### D. VAT (tuỳ chọn Phase 5+)

- Mặc định `VatAmount = 0` (không xuất hoá đơn VAT).
- Khi có yêu cầu xuất VAT: thêm `IsVatInvoice` flag + logic tính 10% VAT.
- Tích hợp VNPT Invoice API hoặc Misa eInvoice là Phase 6+.

---

### 5.10 Tổng hợp thay đổi file

| File | Trạng thái |
|---|---|
| `deploy/phase5-migration.sql` | 🆕 |
| `MLS.Domain/Entities/OrderItem.cs` | ✏️ thêm `ItemType`, `CourseId`, `CourseSlug` |
| `MLS.Domain/Entities/Invoice.cs` | 🆕 |
| `MLS.Infrastructure/Persistence/Configurations/InvoiceConfiguration.cs` | 🆕 |
| `MLS.Application/Common/Interfaces/IApplicationDbContext.cs` | ✏️ thêm `DbSet<Invoice>` |
| `MLS.Application/Orders/Commands/CreateCheckoutCommand.cs` | ✏️ hỗ trợ course items |
| `MLS.Application/Orders/Events/GrantCourseEnrollmentHandler.cs` | 🆕 |
| `MLS.Application/Invoice/Commands/GenerateInvoiceCommand.cs` | 🆕 |
| `MLS.Application/Invoice/Queries/GetInvoiceByOrderQuery.cs` | 🆕 |
| `MLS.Infrastructure/Invoice/InvoiceTemplateDocument.cs` | 🆕 (QuestPDF) |
| `MLS.API/Controllers/InvoiceController.cs` | 🆕 |
| `MLS.API/Controllers/Admin/AdminInvoiceController.cs` | 🆕 |
| `frontend/src/lib/features/cart/cartSlice.ts` | ✏️ thêm `itemType`, `courseId` |
| `frontend/src/lib/features/orders/invoiceApi.ts` | 🆕 |
| `frontend/src/app/khoa-hoc/[slug]/page.tsx` | ✏️ thêm buy CTA |
| `frontend/src/app/don-hang/[id]/page.tsx` | ✏️ thêm nút tải hóa đơn |
| `frontend/src/app/admin/don-hang/[id]/page.tsx` | ✏️ thêm nút tải hóa đơn |

---

### 5.11 Timeline Phase 5

```
Tuần 12  ████████████ Course Commerce Backend (5.1) + Invoice Backend bắt đầu (5.2)
Tuần 13  ████████████ Invoice Backend hoàn thiện + Frontend (5.3)
─────────────────────────── Phase 5 Done ───────────────────────────────

Tổng cộng (cập nhật): 13 tuần
```

*Tài liệu này là living document — cập nhật theo từng sprint.*
