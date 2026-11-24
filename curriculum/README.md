# Hệ thống viết bài

Thư mục này chứa mọi thứ cần để **tự động viết bài một cách nhất quán qua nhiều phiên làm việc**, và để mở rộng lộ trình về sau mà không mất ngữ cảnh.

## Bản đồ

| File | Vai trò |
|---|---|
| `syllabus.json` | **Nguồn sự thật duy nhất.** Lộ trình (track → module → bài), mục tiêu, từ khóa mỗi bài dạy, trạng thái, `recap` của bài đã xong. Trang web đọc trực tiếp file này |
| `style-guide.md` | Quy chuẩn: cấu trúc bài, giọng văn, cách viết SQL, component, tiêu chí hoàn thành |
| `glossary.md` | Thuật ngữ thống nhất; script cảnh báo các từ cần tránh |
| `datasets.md` | Dữ liệu mẫu có những tình huống nào (NULL, quan hệ, trường hợp biên) để chọn ví dụ |
| `log.md` | Nhật ký: mỗi bài đã viết thế nào, quyết định gì, còn gì dang dở |
| `PROGRESS.md` | Bảng tiến độ, tự sinh bởi `npm run validate` |
| `snapshots.json` | Ảnh chụp kết quả từng playground, để phát hiện khi dữ liệu thay đổi làm sai lời giải thích |

Công cụ:

| Công cụ | Dùng để |
|---|---|
| `/viet-bai`, `/viet-bai 5`, `/viet-bai basics/07-null` | Skill viết bài tự động (`.claude/skills/viet-bai/SKILL.md`) |
| Agent `lesson-reviewer` | Duyệt độc lập một bài: chạy SQL kiểm chứng mọi con số, đánh giá sư phạm (`.claude/agents/lesson-reviewer.md`) |
| `npm run validate` | Kiểm tra máy móc: chạy mọi playground và lời giải bài tập, từ khóa chưa dạy, thuật ngữ, cấu trúc |
| `node scripts/sql.mjs [--pg] "SQL"` | Chạy nhanh SQL trên dataset để khảo sát hoặc kiểm chứng |

## Vòng đời một bài

```
planned ──► drafting ──► (validate + lesson-reviewer PASS) ──► done
rewrite: bản nháp viết trước khi có quy chuẩn, được viết lại như một bài planned
```

Bài `done` bắt buộc: 0 lỗi validate, đủ cấu trúc (≥4 playground, ≥3 bài tập, Tóm tắt, Lỗi hay gặp…), reviewer PASS, có `recap`.

## Ba lớp kiểm soát chất lượng

1. **Máy** (`npm run validate`): những gì kiểm được tự động. Không qua thì không thể `done`.
2. **Reviewer độc lập** (agent): đọc bài với ngữ cảnh mới, như người học, và tự chạy SQL kiểm chứng phần chữ.
3. **Ngữ cảnh tích lũy** (`recap`, `log.md`, `datasets.md`): bài sau biết chính xác bài trước đã dạy gì và đã hứa gì.

## Mở rộng

**Thêm bài vào lộ trình có sẵn:** thêm mục vào `lessons` trong `syllabus.json` (id, order, module, title, objectives, introduces, status `planned`). Đánh lại `order` nếu chen giữa (đổi luôn `order` trong frontmatter các bài đã viết). Chạy `npm run validate`.

**Thêm lộ trình mới** (ví dụ SQL Server, SQL cho phân tích dữ liệu):
1. Thêm vào `tracks` trong `syllabus.json`: `name`, `summary`, `level`, `engine` (`sqlite` hoặc `postgres`), `dataset`, `requires`.
2. Thêm các bài với id `<track>/<NN-slug>`.
3. Tạo thư mục `src/content/lessons/<track>/`. Trang web tự hiện lộ trình mới trên menu, trang chủ và trang lộ trình.
4. Cần engine mới (ví dụ DuckDB): thêm worker trong `src/engines/`, thêm vào `spawn()` trong `src/engines/client.ts`, `EngineId` trong `src/data/tracks.ts`, `ENGINE_LABEL` trong `src/components/sql-ui.tsx`, và hàm chạy tương ứng trong `scripts/validate-lessons.mjs`, `scripts/sql.mjs`.

**Thêm dataset:** tạo `public/datasets/<tên>.sql`, mô tả trong `datasets.md`, dùng bằng `dataset="<tên>"` trên `<Playground>`/`<Exercise>` hoặc đặt mặc định cho cả lộ trình trong `syllabus.json`.

**Đổi quy chuẩn:** sửa `style-guide.md` / `glossary.md`, rồi chạy `npm run validate` để thấy bài nào bị ảnh hưởng. Bài cần sửa nhiều thì đổi status về `rewrite`.
