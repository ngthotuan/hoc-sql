---
name: viet-bai
description: Tự động viết (hoặc viết lại) bài học cho trang Học SQL theo lộ trình curriculum/syllabus.json. Mỗi bài đi qua đủ vòng: nạp ngữ cảnh, khảo sát dữ liệu, dàn ý, viết, npm run validate, agent lesson-reviewer duyệt độc lập, sửa tới khi đạt, rồi cập nhật tiến độ và nhật ký. Dùng khi người dùng nói "viết bài", "viết tiếp", "viết N bài", "/viet-bai", "/viet-bai 5", hoặc chỉ định bài như "/viet-bai basics/07-null".
---

# Viết bài tự động

Tham số:
- (trống): viết **1** bài tiếp theo.
- Một số `N`: viết **N** bài tiếp theo, lần lượt, mỗi bài hoàn tất cả vòng trước khi sang bài sau.
- Một id (`basics/07-null`): viết đúng bài đó.

Chất lượng quan trọng hơn tốc độ. Không bỏ bước. Không đánh dấu `done` khi reviewer chưa PASS.

---

## Bước 0: Chọn bài

1. Chạy `npm run validate` để `curriculum/PROGRESS.md` mới nhất. Đọc dòng "Bài cần làm tiếp theo".
2. Đọc 3 mục mới nhất của `curriculum/log.md` (bối cảnh, việc dang dở).
3. Thứ tự ưu tiên: bài đang `drafting` (làm dở) → bài người dùng chỉ định → bài tiếp theo trong PROGRESS.md.
4. Đổi status bài trong `curriculum/syllabus.json` thành `"drafting"`. Báo người dùng một dòng: đang viết bài nào.

## Bước 1: Nạp ngữ cảnh (đọc đầy đủ, không đọc lướt)

- `curriculum/style-guide.md`, `curriculum/glossary.md`, `curriculum/datasets.md`.
- Mục của bài trong `syllabus.json`: `objectives`, `introduces`, `notes`, `kind`.
- `recap` của **mọi bài trước** trong lộ trình (và lộ trình trong `requires`): đây là những gì người học đã biết.
- File MDX của **bài liền trước** (giọng văn, cách giải thích, ví dụ đã dùng, câu nối của nó hứa hẹn gì).
- Mục syllabus của **2 bài liền sau**: để không dạy trước nội dung của chúng, và để viết câu nối.
- Nếu là bài `rewrite`: đọc bản nháp cũ và `notes`. Giữ ý tốt, nhưng viết lại theo quy chuẩn.

## Bước 2: Khảo sát dữ liệu

Trước khi viết, chạy thử mọi câu SQL định dùng: `node scripts/sql.mjs "…"` (thêm `--pg` cho PostgreSQL).
- Chọn ví dụ có **kết quả đáng giảng**: có hàng bị loại, có trường hợp biên, 2–12 hàng.
- Ghi lại kết quả thật để dùng khi viết đoạn "đọc kết quả".
- Cần tình huống mà dataset không có thì **tạo dataset mới**, không sửa dataset cũ. Cập nhật `curriculum/datasets.md`.

## Bước 3: Dàn ý

Lập dàn ý (trong đầu hoặc trong scratchpad, không lưu vào repo) theo cấu trúc ở style-guide mục 3. Với mỗi phần `##`: ý chính, playground và kết quả mong đợi, lỗi hay gặp liên quan. Kiểm tra:
- phủ hết `objectives`;
- mọi từ khóa trong `introduces` đều được dạy và dùng trong ít nhất một playground hoặc bài tập;
- không dùng từ khóa của bài sau;
- bài tập tăng dần độ khó, có ít nhất một bài buộc kết hợp kiến thức bài này với bài trước.

## Bước 4: Viết

- File `src/content/lessons/<id>.mdx`; `title`, `order` khớp syllabus.
- Theo đúng style guide. Mỗi playground có đoạn đọc kết quả với số liệu thật. Giải thích "vì sao" và cơ chế bên trong khi phù hợp.
- Bài tập dùng `<Exercise>` (đề bài + khối ```sql lời giải ở cuối, `hint` khi hữu ích). Đề bài phải nói rõ **cần những cột nào, theo thứ tự nào** để chỉ có một kết quả đúng.

## Bước 5: Tự kiểm tra

1. `npm run validate -- <id>`: sửa tới khi **0 lỗi**, và xử lý mọi cảnh báo (hoặc ghi lý do vào log nếu cố ý giữ).
2. Đối chiếu từng con số trong phần chữ với kết quả thật.
3. `npx astro build` thành công.

## Bước 6: Duyệt độc lập (bắt buộc)

Gọi agent **`lesson-reviewer`** (Agent tool, `subagent_type: "lesson-reviewer"`) với prompt: `Duyệt bài <id>.`
Nếu loại agent này chưa có trong danh sách (ví dụ vừa được tạo trong phiên), dùng `general-purpose` với prompt yêu cầu đọc và làm đúng theo `.claude/agents/lesson-reviewer.md`, kèm id bài.
Không gửi kèm ý kiến của bạn về bài, để reviewer đánh giá không bị dẫn dắt. Mỗi vòng dùng **agent mới**. Có thể duyệt song song nhiều bài khác nhau, và viết bài kế tiếp trong lúc chờ.
Khi chạy validate song song với reviewer, đặt timeout dài (PGlite khởi động chậm khi nhiều tiến trình cùng chạy).

- `NEEDS_CHANGES`: sửa **mọi** BLOCKER và MAJOR, sửa MINOR hợp lý. Chạy lại Bước 5, rồi gọi reviewer lần nữa (agent mới).
- Tối đa **3 vòng**. Nếu sau 3 vòng vẫn còn BLOCKER/MAJOR: giữ status `drafting`, ghi rõ vấn đề còn lại vào log, báo người dùng và dừng (không sang bài tiếp).
- Nếu bạn không đồng ý với một vấn đề reviewer nêu, kiểm chứng bằng SQL. Reviewer sai thì ghi lý do vào log; không bỏ qua vấn đề chỉ vì thấy phiền.

## Bước 7: Hoàn tất

1. `syllabus.json`: status `"done"`, điền `"recap"`: 1–3 câu nêu điều người học đã nắm sau bài (cụ thể: khái niệm, từ khóa, bẫy đã biết). Bài sau sẽ dựa vào đây.
   Nếu trong lúc viết thấy lộ trình cần chỉnh (tách/gộp bài, chuyển từ khóa giữa các bài), sửa syllabus và ghi vào log.
2. `npm run validate` toàn bộ: 0 lỗi. Cập nhật PROGRESS.md và snapshots.
3. Kiểm tra trực quan nếu có công cụ trình duyệt (Claude in Chrome): `npm run build && npm run preview`, xem bài ở chế độ sáng, tối, khung hẹp; bấm Chạy một playground và Kiểm tra một bài tập.
4. Thêm mục vào **đầu** `curriculum/log.md` (theo mẫu trong file), gồm số vòng review và các quyết định.
5. Báo người dùng: bài vừa xong, đường dẫn `/<track>/<slug>/`, điểm đáng chú ý, bài tiếp theo.

Viết N bài: lặp Bước 0–7 cho từng bài. Không commit git trừ khi người dùng yêu cầu.
