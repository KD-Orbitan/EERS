# EERS — Agent Instructions

## Document Priority (D-027)
1. DECISIONS.md  ← tuyệt đối, không được override
2. SCHEMA.md
3. API.md
4. WORKFLOWS.md
5. PLAYBOOK-API.md
6. REFERENCE.md

## Mandatory Rules
- Đọc DECISIONS.md trước mọi task
- Chỉ implement những gì có trong docs — không tự thêm endpoint, column, logic
- Primary key: BIGSERIAL autoincrement only, không dùng UUID/CUID (D-001)
- Không hard delete users, businesses, reviews — chỉ soft delete (D-007)
- Không access Prisma ngoài infrastructure layer (D-018)
- Không access Redis ngoài infrastructure layer (D-010)
- Không tính ranking trong controller hoặc repository (D-011)
- SSE push luôn nằm NGOÀI transaction block (D-015)
- Mọi list query phải filter deletedAt: null mặc định (D-007)
- Response luôn wrap trong envelope { success, data } (D-022)
- Không expose stack trace, SQL error, Prisma error ra response (D-022)

## Architecture Rules (D-018)
Dependency direction: Presentation → Application → Domain ← Infrastructure
- Controller không được gọi Prisma trực tiếp
- Controller không được gọi Redis trực tiếp
- UseCase không được gọi Prisma trực tiếp
- Module A không được import Repository của Module B

## Checkpoint Format
Sau mỗi phase báo cáo:
✓/✗ Files created: [list]
✓/✗ Tests passed: [X/X]
✓/✗ Migration applied: yes/no
✓/✗ Definition of Done: [từng item]

## Package Manager Rules (CRITICAL)
- Dùng pnpm cho MỌI lệnh install, KHÔNG ĐƯỢC dùng npm install
- Install package mới: pnpm add <package> --filter api
- Install devDependency: pnpm add -D <package> --filter api
- Chạy script: pnpm --filter api run <script>
- KHÔNG tạo package-lock.json — nếu thấy file này xuất hiện, xóa ngay
- Nếu pnpm không available: báo lại cho user, KHÔNG tự chuyển sang npm