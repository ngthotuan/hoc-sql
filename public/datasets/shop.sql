-- =============================================================================
-- Dataset "shop": cửa hàng cà phê nhỏ bán online
-- Dùng chung cho SQLite và PostgreSQL. Tài liệu: curriculum/datasets.md
-- KHÔNG sửa dữ liệu đã có: các bài học giải thích kết quả dựa trên đúng dữ liệu này.
-- =============================================================================

CREATE TABLE customers (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  email       TEXT UNIQUE,                          -- có thể NULL: khách đặt qua điện thoại
  phone       TEXT,                                 -- có thể NULL: khách không để lại số
  referred_by INTEGER REFERENCES customers(id),     -- ai giới thiệu khách này (NULL: tự tìm đến)
  joined_on   DATE NOT NULL
);

CREATE TABLE products (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL,
  category TEXT NOT NULL,
  price    INTEGER NOT NULL CHECK (price > 0),      -- giá bán hiện tại, đơn vị đồng
  stock    INTEGER NOT NULL CHECK (stock >= 0)      -- số lượng còn trong kho
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_on  DATE NOT NULL,
  status      TEXT NOT NULL,                        -- chờ xác nhận | đang giao | đã giao | đã hủy
  shipped_on  DATE                                  -- NULL: chưa gửi hàng (chờ xác nhận, đã hủy)
);

CREATE TABLE order_items (
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price > 0), -- giá tại thời điểm đặt, có thể khác giá hiện tại
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (id, name, city, email, phone, referred_by, joined_on) VALUES
  (1,  'Nguyễn Thu Hà',    'Hà Nội',    'ha.nguyen@example.com',    '0912345678', NULL, '2024-02-11'),
  (2,  'Trần Minh Khoa',   'TP.HCM',    'khoa.tran@example.com',    NULL,         NULL, '2024-03-05'),
  (3,  'Lê Bảo Ngọc',      'Đà Nẵng',   'ngoc.le@example.com',      '0935111222', 1,    '2024-05-20'),
  (4,  'Phạm Quốc Huy',    'TP.HCM',    NULL,                       '0909876543', 2,    '2024-07-01'),
  (5,  'Võ Thanh Tâm',     'Cần Thơ',   'tam.vo@example.com',       NULL,         NULL, '2024-09-14'),
  (6,  'Đặng Gia Linh',    'Hà Nội',    'linh.dang@example.com',    '0987654321', 1,    '2025-01-03'),
  (7,  'Bùi Anh Tuấn',     'Huế',       'tuan.bui@example.com',     NULL,         3,    '2025-02-18'),
  (8,  'Hoàng Mai Anh',    'Hải Phòng', 'maianh.hoang@example.com', '0977000111', NULL, '2025-04-09'),
  (9,  'Ngô Đức Thịnh',    'Hà Nội',    NULL,                       NULL,         6,    '2025-05-22'),
  (10, 'Lý Kim Chi',       'TP.HCM',    'chi.ly@example.com',       '0901222333', 4,    '2025-06-30'),
  (11, 'Trịnh Quang Vinh', 'Đà Nẵng',   'vinh.trinh@example.com',   NULL,         NULL, '2025-08-15'),
  (12, 'Dương Hải Yến',    'Hà Nội',    'yen.duong@example.com',    '0913444555', 1,    '2025-10-02');

INSERT INTO products (id, name, category, price, stock) VALUES
  (1,  'Cà phê phin nhôm',        'Dụng cụ',  45000, 120),
  (2,  'Cà phê Robusta 500g',     'Cà phê',  120000,  80),
  (3,  'Cà phê Arabica 250g',     'Cà phê',  165000,  35),
  (4,  'Ly sứ men lam',           'Dụng cụ',  89000,  60),
  (5,  'Bình giữ nhiệt 500ml',    'Dụng cụ', 215000,   0),
  (6,  'Trà ô long 200g',         'Trà',     140000,  45),
  (7,  'Trà sen Tây Hồ 100g',     'Trà',     390000,   8),
  (8,  'Bánh pía sầu riêng',      'Bánh',     75000,   0),
  (9,  'Bánh đậu xanh Hải Dương', 'Bánh',     55000, 150),
  (10, 'Máy xay cà phê tay',      'Dụng cụ', 450000,  12),
  (11, 'Cà phê Culi 500g',        'Cà phê',  145000,  50),
  (12, 'Trà shan tuyết 100g',     'Trà',     260000,  20);

INSERT INTO orders (id, customer_id, ordered_on, status, shipped_on) VALUES
  (1,  1,  '2025-03-02', 'đã giao',      '2025-03-04'),
  (2,  2,  '2025-03-04', 'đã giao',      '2025-03-06'),
  (3,  1,  '2025-04-15', 'đã giao',      '2025-04-16'),
  (4,  3,  '2025-04-21', 'đã hủy',       NULL),
  (5,  4,  '2025-05-08', 'đã giao',      '2025-05-12'),
  (6,  2,  '2025-06-12', 'đã giao',      '2025-06-14'),
  (7,  6,  '2025-06-30', 'đã giao',      '2025-07-02'),
  (8,  5,  '2025-07-19', 'đã giao',      '2025-07-25'),
  (9,  6,  '2025-08-02', 'đã giao',      '2025-08-04'),
  (10, 7,  '2025-08-25', 'đã giao',      '2025-08-27'),
  (11, 1,  '2025-09-10', 'đã giao',      '2025-09-11'),
  (12, 4,  '2025-09-28', 'đã hủy',       NULL),
  (13, 9,  '2025-10-05', 'đã giao',      '2025-10-08'),
  (14, 3,  '2025-10-18', 'đã giao',      '2025-10-20'),
  (15, 11, '2025-10-30', 'đang giao',    '2025-11-01'),
  (16, 2,  '2025-11-03', 'đang giao',    '2025-11-05'),
  (17, 6,  '2025-11-08', 'chờ xác nhận', NULL),
  (18, 1,  '2025-11-12', 'chờ xác nhận', NULL),
  (19, 5,  '2025-11-14', 'đang giao',    '2025-11-16'),
  (20, 9,  '2025-11-16', 'chờ xác nhận', NULL);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1,  2,  2, 110000), (1,  1,  1,  45000),
  (2,  3,  1, 165000), (2,  4,  2,  89000),
  (3,  6,  1, 140000), (3,  9,  3,  55000),
  (4,  10, 1, 450000),
  (5,  5,  1, 215000), (5,  2,  1, 110000), (5,  8,  2,  75000),
  (6,  11, 2, 145000),
  (7,  2,  3, 120000), (7,  4,  1,  89000),
  (8,  9,  4,  55000),
  (9,  3,  2, 165000), (9,  1,  2,  45000),
  (10, 6,  2, 140000), (10, 8,  1,  75000),
  (11, 7,  1, 390000),
  (12, 5,  2, 215000),
  (13, 2,  1, 120000), (13, 11, 1, 145000), (13, 1, 1, 45000),
  (14, 10, 1, 450000), (14, 3,  1, 165000),
  (15, 7,  1, 390000), (15, 6,  1, 140000),
  (16, 4,  4,  89000),
  (17, 9,  6,  55000),
  (18, 11, 1, 145000), (18, 4,  1,  89000),
  (19, 2,  2, 120000),
  (20, 8,  3,  75000), (20, 9,  2,  55000);
