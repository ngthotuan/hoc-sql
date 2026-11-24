# Datasets

Mọi bài học dùng dữ liệu từ `public/datasets/<tên>.sql`. Tài liệu này mô tả **những tình huống có sẵn trong dữ liệu**, để người viết chọn ví dụ mà không phải dò lại từ đầu.

Quy tắc:
- **Không sửa dữ liệu đã có** của một dataset khi đã có bài dùng nó. Cần thêm tình huống thì tạo dataset mới (ví dụ `shop-index` có nhiều hàng) và ghi vào đây.
- Dataset phải chạy được trên cả SQLite và PostgreSQL (trừ khi chỉ dành cho một engine, ghi rõ).
- Tra cứu nhanh: `node scripts/sql.mjs "SELECT ..."` (SQLite) hoặc `node scripts/sql.mjs --pg "SELECT ..."` (PostgreSQL).

---

## `shop`: cửa hàng cà phê bán online

Dùng cho: toàn bộ lộ trình `basics`, phần chạy được của `mysql`, các bài đầu của `postgres`.

```
customers (12)            orders (20)                 order_items (34)            products (12)
─────────────             ───────────                 ────────────────            ─────────────
id          PK  ◄──┐      id           PK  ◄────────  order_id    PK, FK          id        PK
name               │      customer_id  FK ─► customers product_id PK, FK ───────► name
city               │      ordered_on                  quantity                    category
email   (NULL, UNIQUE)    status                      unit_price                  price
phone   (NULL)     │      shipped_on   (NULL)                                     stock
referred_by FK ────┘ (tự tham chiếu: ai giới thiệu)
joined_on
```

### Tình huống có sẵn

| Tình huống | Dữ liệu | Dùng cho bài |
|---|---|---|
| Thành phố lặp lại | Hà Nội 4 khách (1, 6, 9, 12), TP.HCM 3 (2, 4, 10), Đà Nẵng 2 (3, 11), Cần Thơ, Huế, Hải Phòng mỗi nơi 1 | WHERE, GROUP BY, DISTINCT |
| NULL ở cột chữ | `email` NULL: khách 4, 9. `phone` NULL: khách 2, 5, 7, 9, 11 | NULL, COALESCE, COUNT(cột) |
| NULL ở cột ngày | `orders.shipped_on` NULL với đơn chờ xác nhận (17, 18, 20) và đã hủy (4, 12) | NULL, IS NULL |
| Tự tham chiếu | `referred_by`: 1 giới thiệu 3, 6, 12; 2 giới thiệu 4; 3 giới thiệu 7; 4 giới thiệu 10; 6 giới thiệu 9. Khách 1, 2, 5, 8, 11 tự tìm đến | Self join, CTE đệ quy (chuỗi giới thiệu 1 → 6 → 9) |
| Khách chưa có đơn | Khách 8, 10, 12 | LEFT JOIN, NOT EXISTS |
| Sản phẩm chưa bán được | Sản phẩm 12 (Trà shan tuyết) | LEFT JOIN, NOT IN |
| Hết hàng | `stock = 0`: sản phẩm 5, 8 | WHERE, CASE |
| Giá thay đổi theo thời gian | Robusta (2): `unit_price` 110000 ở đơn 1, 5; 120000 từ đơn 7 trở đi (= giá hiện tại) | Phân biệt giá hiện tại và giá lúc bán; chuẩn hóa |
| Trạng thái đơn | đã giao 12 (1, 2, 3, 5–11, 13, 14), đang giao 3 (15, 16, 19), chờ xác nhận 3 (17, 18, 20), đã hủy 2 (4, 12) | WHERE, GROUP BY, CASE |
| Khách nhiều đơn | Khách 1: 4 đơn; 2, 6: 3 đơn; 3, 4, 5, 9: 2 đơn; 7, 11: 1 đơn | GROUP BY, HAVING, window function |
| Danh mục | Cà phê 3 (2, 3, 11), Dụng cụ 4 (1, 4, 5, 10), Trà 3 (6, 7, 12), Bánh 2 (8, 9) | GROUP BY, IN |
| Giá | Thấp nhất 45000 (1), cao nhất 450000 (10); 4 sản phẩm dưới 100000 (1, 4, 8, 9) | WHERE, BETWEEN, MIN/MAX |
| Tên có dấu, mẫu chữ | 4 sản phẩm tên bắt đầu bằng "Cà phê" (1, 2, 3, 11), 3 bắt đầu bằng "Trà" (6, 7, 12) | LIKE, so sánh có dấu |
| Sắp xếp chữ có dấu | SQLite so sánh theo mã ký tự: "Đà Nẵng" xếp **sau** "TP.HCM" vì "Đ" (U+0110) lớn hơn mọi chữ Latin không dấu. PostgreSQL kết quả tùy collation | ORDER BY, collation (MySQL) |
| Số mục trong đơn | 34 hàng `order_items`; đơn 5 và 13 có 3 sản phẩm | JOIN, COUNT |
| Ngày | Khách đăng ký 2024-02-11 → 2025-10-02; đơn 2025-03-02 → 2025-11-16 | So sánh ngày, hàm ngày |

Cập nhật bảng trên khi một bài phát hiện thêm tình huống hữu ích.
