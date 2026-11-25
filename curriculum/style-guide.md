# Quy chuẩn viết bài

Mọi bài học phải tuân theo tài liệu này. Mục tiêu: người học đọc bài nào cũng thấy cùng một giọng văn, cùng thuật ngữ, cùng cách trình bày, và hiểu **tường tận** chủ đề chứ không chỉ biết cú pháp.

Đọc kèm: [`glossary.md`](./glossary.md) (thuật ngữ), [`datasets.md`](./datasets.md) (dữ liệu mẫu), [`syllabus.json`](./syllabus.json) (lộ trình), [`log.md`](./log.md) (nhật ký).

---

## 1. Người học là ai

- Người Việt, tự học, có thể **chưa từng viết code** (lộ trình `basics`), hoặc đã biết SQL cơ bản (lộ trình `postgres`, `mysql`).
- Họ học trên trình duyệt, mỗi bài khoảng 20–40 phút.
- Họ cần hiểu **vì sao**, không chỉ **làm thế nào**. Mỗi khái niệm phải trả lời được: nó giải quyết vấn đề gì, database xử lý nó ra sao, khi nào không nên dùng.

## 2. Giọng văn

- Xưng **"bạn"**, giọng thân thiện, rõ ràng, điềm tĩnh. Không cường điệu ("cực kỳ mạnh mẽ", "thần thánh"), không dùng emoji.
- Câu ngắn, chủ động. Một đoạn văn chỉ nói một ý.
- Thuật ngữ tiếng Anh: lần đầu xuất hiện trong bài viết dạng **"khóa chính (primary key)"**, từ đó về sau dùng đúng từ đã chọn trong `glossary.md`.
- Không giả định người học đã biết khái niệm chưa được dạy. Nếu bắt buộc phải nhắc tới, nói rõ "bài X sẽ giải thích kỹ".
- Mọi khẳng định về kết quả phải **khớp với dữ liệu thật** của dataset (ví dụ "có 3 khách ở Hà Nội" thì chạy thử phải ra 3).

## 3. Cấu trúc một bài

Thứ tự các phần cố định. Phần đánh dấu (tùy chọn) chỉ có khi phù hợp.

1. **Frontmatter**: `title`, `description` (1 câu, nói người học sẽ làm được gì), `order`.
2. **Mở bài** (không có tiêu đề, 1–2 đoạn): một tình huống thực tế với cửa hàng trong dataset, dẫn tới câu hỏi mà bài này trả lời. Nối với bài trước nếu có.
3. **Các phần nội dung** (`##`, 3–6 phần). Mỗi phần đi theo nhịp:
   - Giải thích khái niệm bằng lời, ngắn gọn.
   - `<Playground>` minh họa.
   - **Đọc kết quả**: chỉ ra cụ thể trong bảng kết quả có gì và vì sao (hàng nào xuất hiện, hàng nào bị loại, tại sao).
   - Nếu cần, `<Callout type="try">` gợi ý một thay đổi nhỏ để người học tự thử.
4. **Bên trong database** (tùy chọn, khuyến khích từ giữa lộ trình): database thực thi câu lệnh thế nào (thứ tự xử lý, index, kế hoạch thực thi…).
5. **Lỗi hay gặp**: 1–3 `<Callout type="warn">` mô tả lỗi thật người mới hay mắc, kèm cách nhận biết và cách sửa. Có thể dùng `<Playground expect="error">` để người học thấy thông báo lỗi thật.
6. **Khác nhau giữa các database** (tùy chọn): bảng ngắn so sánh SQLite / PostgreSQL / MySQL khi cú pháp hoặc hành vi khác nhau.
7. **Tóm tắt** (`## Tóm tắt`): 3–6 gạch đầu dòng, mỗi dòng là một điều người học cần nhớ.
8. **Bài tập** (`## Bài tập`): 3–5 `<Exercise>` tự chấm, từ dễ tới khó, chỉ dùng kiến thức đã học. Ít nhất một bài buộc kết hợp kiến thức bài này với bài trước. Đề bài phải nói rõ **cần những cột nào, theo thứ tự cột nào, sắp xếp ra sao (nếu có)** để chỉ một kết quả là đúng.
9. **Câu nối** (1 câu, cuối bài): bài tiếp theo giải quyết vấn đề gì.

Độ dài mục tiêu: **1.200–2.500 từ**, **4–8 playground**. Bài khó có thể dài hơn; chia bài thay vì nhồi nhét.

## 4. Quy tắc SQL trong bài

```sql
SELECT c.name,
       COUNT(o.id) AS so_don
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.id
WHERE c.city = 'Hà Nội'
  AND c.joined_on >= '2024-06-01'
GROUP BY c.name
ORDER BY so_don DESC;
```

- Từ khóa SQL **VIẾT HOA**; tên bảng, cột viết thường dạng `snake_case`.
- Mỗi mệnh đề (`SELECT`, `FROM`, `WHERE`, `GROUP BY`…) bắt đầu một dòng mới. Điều kiện nối tiếp canh **thẳng mép phải** với từ khóa của mệnh đề: `  AND`, `   OR` dưới `WHERE` (từ khóa kết thúc cùng cột với `WHERE`); `  ON` dưới `JOIN` thụt 2 dấu cách.
- Nhiều cột trong `SELECT`: mỗi cột một dòng, căn thẳng dưới cột đầu tiên, khi có từ 3 cột hoặc có biểu thức.
- Bí danh (alias) do bài đặt: tiếng Việt **không dấu**, `snake_case` (`so_don`, `gia_giam`). Luôn có `AS`.
- Chuỗi dùng nháy đơn. Kết thúc câu lệnh bằng `;`.
- Chú thích trong SQL bằng `-- ` và tiếng Việt có dấu.
- Không dùng `SELECT *` ngoài bài nhập môn, trừ khi chính bài đang nói về nó.
- Chỉ dùng từ khóa đã được dạy ở bài này hoặc bài trước (script kiểm tra sẽ cảnh báo).

## 5. Component dùng trong MDX

```mdx
<Playground>
```sql
SELECT name FROM products;
```
</Playground>

<Playground engine="postgres">…</Playground>    lộ trình PostgreSQL
<Playground expect="error">…</Playground>        câu lệnh cố ý gây lỗi để minh họa

<Exercise hint="Gợi ý ngắn, không lộ đáp án">
Đề bài: nói rõ cột cần lấy và thứ tự.

```sql
-- khối sql CUỐI CÙNG là lời giải mẫu
SELECT name FROM products;
```
</Exercise>

<Callout type="try">Gợi ý thực hành</Callout>
<Callout type="note">Ghi chú, kiến thức bên lề</Callout>
<Callout type="warn">Lỗi hay gặp, điều cần cẩn thận</Callout>
```

- **Không** truyền SQL qua thuộc tính `code={...}`: MDX sẽ xóa thụt lề.
- `<Exercise>` chấm bằng cách so **kết quả** (không so chữ), bỏ qua tên cột; chỉ so thứ tự hàng khi lời giải có `ORDER BY` ở cấp ngoài cùng. Vì vậy đề bài cần ORDER BY thì phải nói rõ thứ tự; đề bài không yêu cầu thứ tự thì lời giải đừng có ORDER BY.
- Bài tập phải là câu SELECT (component so sánh bảng kết quả cuối cùng).
- Bảng Markdown tự cuộn ngang trên điện thoại, không cần xử lý thêm.
- Code tĩnh (không chạy được, ví dụ cú pháp riêng của MySQL) dùng khối ` ```sql ` thường, và **ghi rõ đây là ví dụ** kèm kết quả mẫu.
- Không nhắc tới phím tắt cụ thể (Ctrl/⌘) trong bài; nút Chạy tự hiển thị phím tắt đúng với máy.

## 6. Dataset

- Lộ trình `basics` và phần chạy được của `mysql` dùng **`shop`** (`public/datasets/shop.sql`): 4 bảng `customers`, `products`, `orders`, `order_items`. Các tình huống có sẵn (NULL, tự tham chiếu, khách chưa có đơn…) liệt kê trong `datasets.md`: đọc trước khi chọn ví dụ.
- **Không sửa dữ liệu đã có trong `shop`.** Các bài cũ đã giải thích kết quả dựa trên dữ liệu này. Cần thêm dữ liệu thì tạo dataset mới (ví dụ `shop-pg` cho PostgreSQL), khai báo trong `syllabus.json` và dùng `<Playground dataset="shop-pg">`.
- Nếu một bài cần một tình huống dữ liệu đặc biệt (hàng có NULL, khách chưa có đơn…), ưu tiên tận dụng dữ liệu có sẵn; nếu không có, tạo dataset mới, không vá dataset cũ.
- `npm run validate` lưu "ảnh chụp" kết quả của từng playground trong `curriculum/snapshots.json`. Nếu kết quả thay đổi, script báo để bạn kiểm tra lại lời giải thích trong bài.

## 7. Kiểm tra chất lượng trước khi đánh dấu xong

Một bài chỉ được `done` khi qua cả ba lớp: `npm run validate` 0 lỗi (script tự áp các tiêu chí cấu trúc cho bài `done`), agent `lesson-reviewer` trả về PASS, và đã điền `recap` trong syllabus.

- [ ] Mọi playground chạy đúng (`npm run validate` không lỗi).
- [ ] Mỗi playground đều có đoạn **đọc kết quả** ngay sau nó.
- [ ] Mọi con số, tên, giá trị nhắc trong bài khớp với kết quả thật.
- [ ] Không dùng khái niệm/từ khóa chưa dạy (script cảnh báo).
- [ ] Thuật ngữ đúng `glossary.md` (script cảnh báo các từ cần tránh).
- [ ] Có phần Lỗi hay gặp, Tóm tắt, Bài tập (≥3 `<Exercise>`), câu nối.
- [ ] Mỗi đề bài tập chỉ có một cách hiểu, và lời giải trả về ít nhất 1 hàng.
- [ ] Đọc lại toàn bài một lượt như người mới: chỗ nào phải đọc lại hai lần thì viết lại.
- [ ] Xem trang thật ở chế độ sáng, tối và trên điện thoại.

## 8. Lỗi đã gặp khi duyệt bài (đọc trước khi viết)

Các lỗi dưới đây đã bị reviewer bắt ở những bài trước. Kiểm tra bài mới không lặp lại chúng.

- **Khẳng định về hành vi database phải đúng trên SQLite.** SQLite dễ dãi hơn SQL chuẩn ở nhiều chỗ: nhận chữ vào cột số, cho dùng bí danh trong WHERE, coi `"chuỗi"` (nháy kép) là chuỗi khi không trùng tên cột. Trước khi viết "database không cho phép X", chạy thử X trên cả SQLite (`node scripts/sql.mjs`) và PostgreSQL (`--pg`), rồi viết đúng điều xảy ra trên từng engine.
- **Chú thích tiếng Anh ở lần xuất hiện đầu trong mỗi bài**, kể cả những từ quen như bảng (table), hàng (row), cột (column), kết quả (result set), câu lệnh (statement), mệnh đề (clause), điều kiện (condition).
- **"Hàng" cho row, "dòng" chỉ cho dòng code.** Không viết "mỗi dòng trong bảng".
- **Không chỉ hàng theo vị trí** ("hàng đầu tiên", "hai hàng đầu") khi câu lệnh không có ORDER BY. Chỉ theo nội dung: "hàng của chị Hà", "hai hàng của đơn số 1".
- **Ví dụ trong bài phải theo đúng quy tắc trình bày** ở mục 4 (từ 3 cột hoặc có biểu thức thì mỗi cột một dòng; 1–2 cột thì cùng dòng `SELECT`). `npm run validate` cảnh báo dòng `SELECT` có từ 3 cột, và 1–2 cột thường bị tách dòng.
- **Bài tập không chép lại playground.** Đổi cột, đổi tình huống, hoặc mô tả nhu cầu bằng lời để người học tự tìm tên cột. Nên có một bài "sửa câu lệnh lỗi" (dùng `starter={"...\n..."}` chứa lỗi). Câu hỏi đọc kết quả (không chấm được) phải có đáp án trong `<details>`.
- **Không khẳng định tuyệt đối** ("lỗi phổ biến nhất", "mọi câu SQL đều…") khi không có căn cứ hoặc khi bài sau sẽ có ngoại lệ (ví dụ câu truy vấn bắt đầu bằng `WITH`).
- **Tóm tắt chỉ chứa điều thân bài đã nói.** Không đưa ý mới vào Tóm tắt.
- **Lời hứa ở bài trước phải được thực hiện.** Đọc câu nối và các câu "bài sau sẽ…" của bài trước, và trả lời chúng trong bài này.
- **Mọi ví dụ đều phải chạy thử, kể cả ví dụ nằm trong bảng minh họa hay trong câu văn** (ví dụ cột "Khớp với" của một bảng ký tự đại diện). Reviewer đã bắt lỗi `'_à%'` được ghi là khớp "Trà…" trong khi thực tế không khớp.
- **Mẫu chữ (`LIKE`) dễ khớp những hàng bất ngờ**: `'%Anh%'` khớp cả "T**hanh**". Khi nêu số hàng của một mẫu, chạy thử và liệt kê đủ.
- **Bài tập phải có điều kiện thật sự loại bớt hàng.** Nếu điều kiện lọc giữ lại mọi hàng (ví dụ `phone LIKE '09%'` khi mọi số đều bắt đầu bằng 09), người học không thấy tác dụng và các lời giải sai về ý vẫn được chấm đúng.
- **Bài tập có `ORDER BY` phải cho thứ tự duy nhất.** Trình chấm so thứ tự hàng khi lời giải có ORDER BY; nếu hai hàng hòa nhau theo tiêu chí sắp xếp mà khác nhau ở cột khác, thứ tự giữa chúng không xác định và đáp án đúng có thể bị chấm sai. Thêm tiêu chí phụ (ví dụ `, name`) và ghi rõ trong đề.
- **Giải thích cơ chế phải đúng với từng engine.** Ví dụ ngày giờ: SQLite so ngày như chữ (`'2025-06-30 00:00'` > `'2025-06-30'` vì dài hơn), còn PostgreSQL/MySQL hiểu `'2025-06-30'` là 0 giờ ngày 30. Một câu giải thích chung cho "database" thường sai ở một trong hai.
- **Dùng `SELECT` không có `FROM`** chỉ từ bài 7 trở đi (bài 7 giới thiệu nó). Trên PostgreSQL, `1`/`0` không phải đúng/sai: viết `true`/`false`.
- **Sửa đề thì sửa cả gợi ý và lời giải.** Đã có lỗi gợi ý ghi "nhân 1.08" trong khi đề đổi sang thuế 10%.
- **Hàm trong lời giải phải có tác dụng trên dữ liệu được chọn.** `COALESCE` cho một khách mà mọi đơn đều đã gửi thì không thay NULL nào, người học bỏ hàm vẫn được chấm đúng (`npm run validate` kiểm COALESCE tự động).
- **Không bịa số minh họa.** Mọi con số, kể cả ví dụ sai số thập phân, phải lấy từ một lần chạy thật.
- **Hàm tổng hợp được tính ở bước gộp** (GROUP BY, hoặc cả bảng là một nhóm), sau WHERE và trước HAVING; `SELECT` chỉ chọn cột và đặt bí danh. Đừng viết "SELECT tính hàm tổng hợp": mâu thuẫn với việc HAVING (chạy trước SELECT) dùng được hàm tổng hợp.
- **Đề bài tập phải tính tới mọi trạng thái trong dữ liệu.** "Cửa hàng nhận bao nhiêu đơn" mơ hồ khi có đơn đã hủy; ghi rõ "tính mọi trạng thái" hoặc lọc trạng thái cụ thể.
- **SQLite có cấu hình riêng trong ô thực hành** (`PRAGMA foreign_keys = ON` trong `sqlite.worker.ts`). Khi mô tả hành vi mà cấu hình này ảnh hưởng, nói rõ SQLite mặc định làm gì.
