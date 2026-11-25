# Nhật ký viết bài

Mục mới nhất ở trên cùng. Mỗi lần viết hoặc sửa bài, thêm một mục theo mẫu dưới đây.
Nhật ký giúp lần viết sau nắm được bối cảnh: đã quyết định gì, vì sao, còn gì dang dở.

```
## YYYY-MM-DD: <id bài> (<trạng thái mới>)
- Đã làm: …
- Quyết định: … (dataset, cách giải thích, chỉnh lộ trình, cảnh báo cố ý bỏ qua và lý do)
- Thuật ngữ / khái niệm mới đưa vào: …
- Cần lưu ý cho bài sau: …
- Còn dang dở: …
```

---

## 2026-11-26: basics/21–25 (UNION, CTE, window function, INSERT, UPDATE/DELETE)
- Đã làm: 21 phép tập hợp (PASS vòng 4), 22 CTE (PASS vòng 3), 23 window function (PASS vòng 4), 24 INSERT (PASS vòng 3), 25 UPDATE/DELETE (PASS vòng 6: các vòng lần lượt bắt ví dụ ghi đè shipped_on, bài tập chấm đúng cả lời giải quên WHERE/xóa thừa, tình huống nhập kho phi logic). Bài 21, 23 vượt quy tắc 3 vòng: MAJOR còn lại là đề có điều kiện thừa (21) và cấu trúc bài (23), sửa dứt điểm nên tiếp tục.
- Một số reviewer bị ngắt do hết hạn mức (rate limit); tiếp tục bằng SendMessage tới chính agent đó, không phải chạy lại từ đầu.
- Công cụ:
  - `Exercise.tsx`: lời giải có INSERT/UPDATE/DELETE/CREATE/ALTER/DROP thì khôi phục dữ liệu gốc (`session.reset()`) trước khi chạy câu của người học. Bài tập thay đổi dữ liệu kết thúc bằng SELECT lộ ra mọi giá trị người học nhập (style-guide mục 5 đã cập nhật).
  - `npm run validate` thêm cảnh báo: đề nói tới "đơn" mà không nêu trạng thái (lời giải đọc `orders` mà không lọc `status`); dòng bắt đầu bằng `SELECT` (viết hoa) chứa luôn `FROM`; phép thử "chỉ giữ một vế của UNION" (vế kia thừa).
  - Phép thử mới: với lời giải có UPDATE/DELETE, bỏ WHERE của từng câu; kết quả cuối không đổi → SELECT cuối không lộ hàng bị sửa thừa.
  - Đã thêm "tính mọi trạng thái" vào đề ở bài 11, 16, 17, 18, 21, 23 (lời giải không đổi).
- Quyết định nội dung:
  - Phép tập hợp: SQLite làm UNION/INTERSECT trái sang phải và không cho ngoặc quanh SELECT; PostgreSQL ưu tiên INTERSECT. ORDER BY sau phép tập hợp không nhận biểu thức; PostgreSQL không nhận tên có tiền tố bảng. Phép tập hợp coi NULL bằng nhau.
  - CTE: SQLite báo `circular reference` khi CTE trùng tên đọc chính bảng đó; PostgreSQL hiểu là bảng thật. AS MATERIALIZED (SQLite 3.35+, PG 12+).
  - Window function: ROW_NUMBER khi hòa khác nhau giữa SQLite và PostgreSQL; cửa sổ chỉ thấy hàng đã qua WHERE; RANK() OVER (ORDER BY SUM(…)) sau GROUP BY không phải lồng hàm tổng hợp.
  - INSERT: PostgreSQL bỏ danh sách cột thì điền các cột đầu, có thể chạy thành công; SQLite nhận chữ vào cột số. Bỏ id: SQLite tự cấp, PostgreSQL lỗi.
  - UPDATE/DELETE: không ghi đè dữ liệu đúng (shipped_on là ngày gửi, không phải ngày nhận); truy vấn con tương quan trong SET nhắc bảng ngoài bằng tên bảng và cần WHERE (không thì NULL → lỗi NOT NULL).
- Cần lưu ý cho bài sau (basics/26 CREATE TABLE): bài 10 hẹn lưu tiền bằng số nguyên/DECIMAL; bài 24 hẹn cột tự tăng ở lộ trình PostgreSQL/MySQL (không phải bài 26); bài 27 hẹn DEFAULT, CASCADE, PRAGMA foreign_keys, NULL trong khóa chính SQLite.

## 2026-11-26: Xong basics/16–20; mục lục cuộn được
- Đã làm: 16 INNER JOIN (PASS vòng 2), 17 LEFT/RIGHT/FULL JOIN (PASS vòng 5), 18 nối nhiều bảng + tự nối + CROSS JOIN (PASS vòng 2), 19 truy vấn con (PASS vòng 3), 20 EXISTS + truy vấn con tương quan (PASS vòng 3) → `done`, có recap.
- basics/17 vượt quy tắc 3 vòng (5 vòng): các MAJOR còn lại đều là câu chữ/giải thích (thiếu "vì sao" điều kiện bảng trái phải ở WHERE; đề "mỗi thành phố bao nhiêu đơn" không nói trạng thái). Mỗi vòng sửa dứt điểm nên tiếp tục thay vì dừng.
- Nhiều reviewer bị ngắt do máy ngủ (API "computer went to sleep"); chạy lại là được.
- Công cụ `npm run validate` thêm:
  - Thẻ component (`<Playground>`…) nằm giữa dòng văn bản → **lỗi** (MDX build hỏng; bài 17 từng dính do chèn bằng script).
  - SELECT 1–2 cột thường mà tách dòng, và SELECT ≥3 cột trên một dòng → cảnh báo.
- Quyết định nội dung:
  - JOIN: luôn ghi tiền tố bí danh cho mọi cột; FROM+JOIN chạy trước (thứ tự logic), database được phép lọc trước/đổi thứ tự INNER JOIN.
  - LEFT JOIN: điều kiện bảng phải ở ON, bảng trái ở WHERE (ON không bao giờ loại hàng bên trái: TP.HCM ra 10 khách thay vì 1). Đếm bằng COUNT(khóa bên phải).
  - SQLite bí danh bảng trùng: không lỗi ngay, chỉ lỗi `ambiguous` khi dùng cột; PostgreSQL lỗi ngay.
  - Truy vấn con vô hướng nhiều hàng: SQLite lặng lẽ lấy một hàng, PostgreSQL/MySQL lỗi.
  - SQLite EXISTS dùng index tạm (AUTOMATIC PARTIAL COVERING INDEX); NOT EXISTS chạy CORRELATED SCALAR SUBQUERY. PostgreSQL: Hash Semi/Anti Join.
  - Đề bài tập phải nói rõ có tính đơn đã hủy hay không (lỗi lặp lại nhiều lần ở bài 17, 18, 20; đã có trong style-guide mục 8).
- UI: mục lục trang bài cuộn riêng (chỉ danh sách cuộn; nút ẩn/hiện và tên lộ trình đứng yên), tự cuộn tới bài đang đọc sau khi font tải xong; nới lề trái để số hai chữ số không bị cắt.
- syllabus notes: basics/21 có hẹn UNION thay FULL JOIN trên MySQL (từ bài 17).
- Cần lưu ý cho bài sau (basics/21 UNION, INTERSECT, EXCEPT): bài 20 câu nối hẹn "danh sách liên lạc gồm cả email lẫn số điện thoại" và "khách vừa có đơn hủy vừa có đơn đã giao". Bài 19/18 hẹn CTE ở bài 22.

## 2026-11-24: Xong basics/10–15; thêm nút ẩn/hiện mục lục; deploy GitHub Pages
- Đã làm: 10 (PASS vòng 4), 11 (PASS vòng 1), 12 (PASS vòng 4), 13 (PASS vòng 1), 14 (PASS vòng 2) → `done`, có recap. 15 (PASS vòng 3; vòng 2 bị MAJOR trình bày SELECT 3 cột trên một dòng → `npm run validate` nay tự cảnh báo lỗi này).
- basics/12 vượt quy tắc 3 vòng: vòng 3 chỉ còn 1 MAJOR về câu chữ đề bài ("nhận đơn" mơ hồ khi có đơn hủy). Đã sửa và cho duyệt vòng 4 thay vì dừng, vì lỗi nhỏ và rõ ràng.
- Quyết định nội dung:
  - Thứ tự xử lý: hàm tổng hợp được tính ở **bước gộp** (GROUP BY, hoặc cả bảng là một nhóm), không phải ở SELECT; SELECT chỉ chọn cột/đặt bí danh. Đã sửa đồng bộ bài 12, 13, 14 (reviewer bắt mâu thuẫn với HAVING chạy trước SELECT).
  - Bí danh: GROUP BY nhận bí danh trên SQLite/PostgreSQL/MySQL; HAVING nhận trên SQLite/MySQL, PostgreSQL lỗi; WHERE chỉ SQLite.
  - GROUP BY không hứa thứ tự: nhóm `muc_gia` ra khác thứ tự giữa SQLite và PostgreSQL.
  - Không GROUP BY + WHERE loại hết = 1 hàng (COUNT 0); có GROUP BY = 0 hàng; HAVING trượt = 0 hàng.
  - basics/15: khóa ngoại được phép NULL (referred_by); SQLite mặc định KHÔNG kiểm tra khóa ngoại (worker bật `PRAGMA foreign_keys = ON`). Ghi vào notes của basics/27, kèm chuyện SQLite cho NULL trong khóa chính không phải INTEGER PRIMARY KEY.
- Component mới: `src/components/ShopDiagram.astro` (sơ đồ quan hệ SVG, màu theo token, cuộn ngang trên điện thoại), đăng ký trong `components` của `[...slug].astro` để MDX dùng `<ShopDiagram />`.
- UI: nút ẩn/hiện mục lục trên trang bài (máy tính ≥ 861px), lưu `localStorage.toc`, áp dụng trước khi vẽ bằng script trong `Base.astro` (`html[data-toc="hidden"]`).
- Deploy: repo `ngthotuan/hoc-sql`, GitHub Pages qua `.github/workflows/deploy.yml` (check + validate + build với `BASE_PATH`). Đường dẫn nội bộ đi qua `withBase()` (`src/lib/url.ts`). Commit tiếng Anh, Conventional Commits, không `Co-Authored-By`.
- Cần lưu ý cho bài sau (basics/16 INNER JOIN): bài 15 hẹn JOIN nối `orders` với `customers` theo `customer_id = id`, và cách viết `bảng.cột`. Bài 13 hẹn LEFT JOIN (bài 17) cho khách chưa có đơn. Bài 12 hẹn truy vấn con (bài 19) cho "sản phẩm đắt hơn giá trung bình".

## 2026-11-20: Xong basics/06–09; basics/10 chờ duyệt vòng 4
- Đã làm: 06 (PASS vòng 6), 07 (PASS vòng 2), 08 (PASS vòng 3), 09 (PASS vòng 2) → `done`, có recap.
- basics/10-ham-xu-ly: **vẫn `drafting`**. Vòng 3 còn 2 MAJOR (bài tập 2 chép playground LENGTH; bài tập 5 "sắp theo tháng" có hai cách hiểu trong bối cảnh năm tài chính). Đã sửa: bài tập 2 → `SUBSTR(phone, 1, 3) = '090'` trong WHERE (2 khách); bài tập 5 → `ORDER BY joined_on`; thêm lưu ý PostgreSQL `ROUND(real, n)` lỗi; giải thích ICU cho UPPER của SQLite; rút gợi ý bài tập 4.
  → **Việc đầu tiên của phiên sau: chạy `lesson-reviewer` vòng 4 cho basics/10; PASS thì điền recap, đánh dấu done.**
- Công cụ: `npm run validate` thêm kiểm tra COALESCE thừa (thay COALESCE(x, …) bằng x mà kết quả không đổi → cảnh báo).
- Bài học rút ra (đã ghi vào style-guide mục 8): sửa đề thì sửa cả hint; hàm trong lời giải phải có tác dụng trên SQLite; không bịa số minh họa; ROUND(1.65, 1) ra 1.6 trên SQLite (sai số số thực) — tránh bài tập làm tròn rơi vào x.x5.
- Cần lưu ý cho bài sau (basics/11 CASE): bài 10 câu nối hẹn "gắn nhãn rẻ / vừa / đắt theo giá". Bài 10 hẹn bài 26 về lưu tiền bằng số nguyên/DECIMAL; bài 31 về index với hàm trên cột.

## 2026-11-20: Đang viết basics/06–09 (tiếp tục sau khi bị ngắt do hết hạn mức)
- Trạng thái: 06 (đã qua 5 vòng review, đang chờ vòng 6), 07 (vòng 2), 08 (vòng 2), 09 (vòng 1) — tất cả `drafting`. Nếu phiên bị ngắt: chạy `lesson-reviewer` cho từng bài này, PASS thì điền recap và đánh dấu done.
- Công cụ mới trong `npm run validate` (bắt các lỗi reviewer lặp đi lặp lại):
  - **Điều kiện thừa**: với lời giải bài tập, bỏ thử từng điều kiện AND ở cấp ngoài cùng của WHERE và từng đầu của BETWEEN; nếu kết quả không đổi → cảnh báo.
  - **DISTINCT thừa**: bỏ DISTINCT mà kết quả không đổi → cảnh báo.
  - Chưa bao phủ: phần tử thừa trong IN/OR, cách hiểu khác của đề — vẫn để reviewer kiểm.
- Sửa lại bài đã done: basics/05 bài tập 3 (sửa lỗi ngoặc) đổi sang 'đã hủy'/'chờ xác nhận' từ 2025-09-01 vì điều kiện trạng thái cũ không có tác dụng.
- syllabus: bỏ "NOT NULL" khỏi introduces của basics/27 (trùng chữ với IS NOT NULL); basics/08 thêm NULLS FIRST/LAST.
- Quyết định nội dung:
  - Bài 7 giới thiệu `SELECT` không có `FROM` và khái niệm hàm (function) qua COALESCE; hẹn bài 10 về đổi kiểu (CAST) cho `COALESCE(ngày, 'chữ')` lỗi trên PostgreSQL.
  - Bài 8: PGlite dùng collation C nên thứ tự chữ có dấu giống SQLite (Huế trước Hà Nội, Đà Nẵng sau TP.HCM, Nguyễn trước Ngô). PostgreSQL chỉ nhận bí danh đứng một mình trong ORDER BY. NULL: SQLite đầu khi ASC/cuối khi DESC; PostgreSQL ngược lại.
  - Bài 9: DISTINCT gộp các NULL thành một (khác với NULL = NULL); LIMIT hòa nhau ở ranh giới (2 sản phẩm stock 0).
- Cần lưu ý cho bài sau (basics/10 hàm): đã hẹn CAST để sửa `COALESCE(shipped_on, 'chưa gửi')` trên PostgreSQL; bài 9 câu nối hẹn "viết hoa tên, làm tròn số, lấy năm từ một ngày".

## 2026-11-19: basics/01–05 done; basics/06 còn đang viết (đã qua 3 vòng review)
- Đã làm: basics/01 (2 vòng), 02 (3 vòng), 03 (3 vòng), 04 (3 vòng), 05 (1 vòng) đều PASS và `done`, có `recap`.
- basics/06-in-between-like: **vẫn `drafting`**. Vòng 3 còn 1 MAJOR: bài tập sửa lỗi email không phân biệt được lời giải sai, vì mọi email đều có đuôi @example.com. Đã sửa theo đề xuất của reviewer: bài tập sửa lỗi đổi sang `'%500g'`; đầu số đổi sang 098; khoảng ngày bài 5 đổi sang 11-03..11-14 để có đơn rơi đúng mốc; bài 1 đổi sang khách đăng ký nửa đầu 2025 (Lý Kim Chi rơi đúng mốc 06-30); thêm Callout try cho `_`; tách đoạn dài; thêm (case-sensitive). Theo quy tắc tối đa 3 vòng, chưa đánh dấu done.
  → **Việc đầu tiên của phiên sau: chạy `lesson-reviewer` vòng 4 cho basics/06, PASS thì điền recap và đánh dấu done.**
- Quyết định: cách thụt lề canh thẳng mép phải với `WHERE` (`  AND`, `   OR`) được ghi chính thức vào style-guide mục 4.
- Cần lưu ý cho bài sau (basics/07 NULL):
  - Bài 4, 5, 6 đều hẹn bài 7 giải thích: `phone <> '0912345678'` ra 6 thay vì 11; `NOT email = 'ha.nguyen@…'` ra 9 thay vì 11; `NOT IN` loại hàng NULL. Bài 3 hẹn COALESCE cho `'Gọi: ' || phone`.
  - Bài 6 hẹn bài 20 về bẫy NOT IN khi danh sách có NULL; hẹn bài 26 về cột có cả ngày lẫn giờ.
  - Style-guide mục 8 đã có thêm: chạy thử mọi ví dụ trong bảng; mẫu LIKE dễ khớp bất ngờ ('%Anh%' khớp "Thanh"); mỗi điều kiện trong bài tập phải loại bớt hàng, kể cả hai đầu của BETWEEN (nên có hàng rơi đúng mốc).

## 2026-11-19: Chuyển sang viết và duyệt tự động; viết basics/01–05
- Đã làm:
  - Thiết kế lại dataset `shop` (12 khách, 12 sản phẩm, 20 đơn, 34 chi tiết) để phủ cả lộ trình: NULL ở email/phone/shipped_on, `referred_by` tự tham chiếu, `unit_price` khác `price`, khách chưa có đơn, sản phẩm chưa bán. Mô tả trong `datasets.md`.
  - Thêm `<Exercise>` tự chấm (so kết quả, bỏ qua tên cột, chỉ so thứ tự hàng khi lời giải có ORDER BY ngoài cùng), `starter` cho bài "sửa câu lỗi", `hint`.
  - Agent `lesson-reviewer`; skill `/viet-bai` thành vòng tự động; trạng thái `review` bị bỏ (không còn bước người duyệt); thêm `recap`.
  - Trang web đọc lộ trình từ `syllabus.json`; trang lộ trình hiện đủ chương trình theo module, bài chưa viết ghi "Sắp có".
  - Sửa engine SQLite: câu SELECT 0 hàng vẫn trả về bảng rỗng có tiêu đề cột (trước đây mất hẳn, làm bài tập báo sai "cần câu SELECT").
  - Snapshot gắn theo nội dung câu SQL, không theo vị trí.
- Quyết định:
  - Ghi đúng hành vi từng engine thay vì khẳng định chung "database …": SQLite dễ dãi về kiểu dữ liệu, bí danh trong WHERE, nháy kép, ngày lưu như chữ. Bài 4 có bảng "Khác nhau giữa các database".
  - Glossary: "trường" chỉ tránh khi nói về cột; mục cần tránh đổi thành "trường dữ liệu" để không báo nhầm "trường hợp". Chú thích trong ngoặc được phép dùng từ cần tránh, ví dụ "index (chỉ mục)".
- Review: basics/01 PASS vòng 2; basics/02 PASS vòng 3. basics/03, 04, 05 đang ở vòng 3, 2, 1. Các lỗi reviewer hay bắt đã ghi vào style-guide mục 8.
- Cần lưu ý cho bài sau:
  - Bài 4 và 5 đã hẹn bài 7 giải thích vì sao NULL không qua `<>`/`NOT` (ví dụ có sẵn: `phone <> '0912345678'` ra 6 khách; `NOT email = 'ha.nguyen@…'` ra 9 khách).
  - Bài 5 hẹn bài 6 dạy `IN` thay cho chuỗi `OR`, và nhắc `BETWEEN`, `LIKE`.
  - Bài 2 hẹn bài 8 giải thích cách gom các thành phố đứng cạnh nhau (sắp xếp); bài 1 hẹn bài 8 về thứ tự hàng.
  - SQLite so sánh chữ theo mã ký tự: "Đà Nẵng" xếp sau "TP.HCM" (ví dụ cho bài 8).

## 2026-11-19: Dựng hệ thống viết bài
- Đã làm: tạo `style-guide.md`, `glossary.md`, `syllabus.json` (75 bài: basics 33, postgres 25, mysql 17), script `npm run validate`, skill `/viet-bai`.
- Quyết định:
  - Dataset `shop` (4 bảng) cố định cho lộ trình basics; không sửa dữ liệu cũ, cần dữ liệu khác thì tạo dataset mới.
  - Lộ trình MySQL chạy phần chung bằng SQLite, phần riêng trình bày dạng ví dụ tĩnh kèm kết quả mẫu.
  - Thuật ngữ: giữ "database", "index", "transaction", "view", "schema", "window function" bằng tiếng Anh; dùng "hàng" (không dùng "bản ghi"), "cột" (không dùng "trường").
  - Trạng thái `review` = Claude viết xong, chờ người dùng duyệt; chỉ người dùng chuyển sang `done`.
- Cần lưu ý cho bài sau:
  - 5 bài viết trước khi có quy chuẩn đang ở trạng thái `draft`: basics/01, 02, 04 (WHERE, đổi tên từ 03), postgres/01, mysql/01. Bài 02 đang dùng `AS` (thuộc bài 03), bài 04 đang gộp nội dung của bài 05 và 06: khi viết lại phải tách ra.
  - basics/07 (NULL) cần dữ liệu có NULL mà `shop` chưa có.
  - Component `<Exercise>` (tự chấm bài) chưa có; tạm thời viết bài tập dạng đề bài + playground + lời giải trong `<details>`.
