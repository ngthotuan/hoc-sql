# Thuật ngữ thống nhất

Dùng đúng cột **"Dùng"** trong mọi bài. Lần đầu xuất hiện trong mỗi bài, ghi kèm tiếng Anh trong ngoặc: "khóa chính (primary key)".
Từ ở cột **"Tránh"** sẽ bị `npm run validate` cảnh báo khi xuất hiện trong phần văn bản.

<!-- Bảng dưới đây được script đọc. Giữ đúng định dạng 4 cột. -->

| Tiếng Anh | Dùng | Tránh | Ghi chú |
|---|---|---|---|
| database | database | cơ sở dữ liệu, CSDL | Giữ "database" vì đây là từ người làm nghề dùng hằng ngày |
| table | bảng | | |
| row | hàng | bản ghi, record | "dòng" chỉ dùng cho dòng code |
| column | cột | trường dữ liệu, field | "trường" một mình cũng tránh khi nói về cột; "trường hợp" thì dùng bình thường |
| query | câu truy vấn | truy xuất | Câu SELECT |
| statement | câu lệnh | | Mọi câu SQL nói chung |
| result set | kết quả, bảng kết quả | tập kết quả | |
| clause | mệnh đề | | WHERE, GROUP BY… |
| keyword | từ khóa | | |
| alias | bí danh | | |
| expression | biểu thức | | |
| condition | điều kiện | | |
| NULL | NULL | giá trị rỗng | NULL nghĩa là "không biết / không có giá trị", khác chuỗi rỗng |
| data type | kiểu dữ liệu | | |
| primary key | khóa chính | | |
| foreign key | khóa ngoại | | |
| constraint | ràng buộc | | |
| index | index | chỉ mục | Lần đầu: "index (chỉ mục)" |
| aggregate function | hàm tổng hợp | hàm gộp, hàm kết tập | |
| subquery | truy vấn con | | |
| correlated subquery | truy vấn con tương quan | | |
| join | phép nối (JOIN) | | Trong văn bản thường viết "JOIN" |
| window function | window function | hàm cửa sổ | Lần đầu: "window function (hàm cửa sổ)" |
| common table expression | CTE | | Lần đầu: "CTE (common table expression)" |
| transaction | transaction | giao dịch | Lần đầu: "transaction (giao dịch)" |
| view | view | khung nhìn | |
| schema | schema | lược đồ | |
| execution plan | kế hoạch thực thi | | Kết quả của EXPLAIN |
| engine | engine | | SQLite, PostgreSQL, MySQL đều gọi là database; "engine" dùng cho phần chạy trong trình duyệt |
| dataset | dataset | bộ dữ liệu mẫu | Dữ liệu cửa hàng `shop` |
| normalization | chuẩn hóa | | |
| duplicate | trùng lặp | | |
| case-sensitive | phân biệt hoa thường | | |
