# Cách mở lại TaskFlow mỗi lần dùng

_TaskFlow chạy hoàn toàn trên máy của bạn (local). MongoDB đã cài dạng Service nên tự chạy nền khi mở máy — bạn không cần mở MongoDB trước._

## Bước 1 — Chạy server (backend)

1. Mở terminal thứ nhất trong thư mục `task-manager`.
2. Gõ:
   ```powershell
   cd server
   npm start
   ```
3. Thấy 2 dòng này là thành công — **giữ nguyên terminal này, đừng tắt**:
   - `MongoDB connected`
   - `API listening on http://localhost:5000`

## Bước 2 — Chạy giao diện (frontend)

1. Mở **terminal mới** (vẫn giữ terminal ở Bước 1 đang chạy).
2. Gõ:
   ```powershell
   cd client
   npm run dev
   ```
   _(Lệnh `npm install` chỉ cần chạy lần đầu tiên, các lần sau bỏ qua.)_

## Bước 3 — Mở trên trình duyệt

Mở Chrome/Edge và vào:

```
http://localhost:5173
```

Đăng nhập như bình thường là dùng được.

## Khi dùng xong — tắt app

Bấm `Ctrl + C` trong cả 2 terminal (server và client) là tắt. Dữ liệu vẫn còn nguyên trong MongoDB, lần sau mở lại theo 3 bước trên.

## Nếu gặp lại các "lỗi" quen thuộc

| Hiện tượng | Có sao không? | Cách xử lý |
|---|---|---|
| Chạy `npm start` bị báo không thấy `package.json` | Không phải lỗi code — bạn đang đứng sai thư mục | Bạn đang ở thư mục gốc `task-manager`; gõ `cd server` rồi chạy lại |
| Mở `http://localhost:5000` thấy `Cannot GET /` | **Bình thường, không phải lỗi** | Cổng 5000 chỉ là API, không có giao diện. Giao diện ở `http://localhost:5173` |
| Vào Compass không thấy database của app | Compass chưa làm mới danh sách | Di chuột lên `localhost:27017`, bấm nút refresh (hoặc disconnect rồi connect lại), sẽ thấy database `taskflow` |
| Mật khẩu trong Compass hiện chuỗi `$2a$10$...` thay vì mật khẩu gốc | **Đúng chuẩn bảo mật, không phải lỗi** | Đó là mật khẩu đã mã hóa bằng bcrypt; app tự so khớp khi bạn đăng nhập |

## Xem dữ liệu đã lưu ở đâu

1. Mở **MongoDB Compass**, kết nối `mongodb://localhost:27017`.
2. Mở database **taskflow**.
3. Các collection: `users` (tài khoản đã đăng ký), `tasks`, `projects`, `reminders`.

## Xóa dữ liệu / tạo database mới

_Nên tắt server trước (bấm `Ctrl + C` ở terminal backend) rồi mới xóa, xong mở lại sau._

**Cách 1 — Xóa sạch, làm lại ngay trong `taskflow`**
Trong Compass: di chuột lên database `taskflow` ở cột trái → bấm biểu tượng thùng rác (Drop Database) → gõ `taskflow` để xác nhận. Không cần tạo lại tay: lần tới bạn đăng ký tài khoản / tạo task, MongoDB tự tạo lại `taskflow` và các collection. Lưu ý: tài khoản đăng nhập cũng mất, phải đăng ký lại.

**Cách 2 — Tạo database MỚI khác tên, giữ nguyên database cũ (an toàn hơn, quay lại được)**
1. Mở file `server/.env`, sửa dòng cuối của `MONGO_URI`: đổi `.../taskflow` thành tên mới, ví dụ `mongodb://127.0.0.1:27017/taskflow_moi`. Lưu file.
2. Chạy lại server (`npm start`). Database mới chưa có gì — đăng ký tài khoản mới và dùng như bình thường; MongoDB tự tạo database + collection khi app ghi dữ liệu đầu tiên.
3. Muốn quay về dữ liệu cũ: sửa `.env` lại thành `.../taskflow` rồi chạy lại server là xong. Database cũ vẫn nguyên trong Compass, khi nào chắc chắn không cần nữa thì Drop nó sau.

**Cách 3 — Chỉ xóa dữ liệu test, giữ tài khoản đăng nhập**
Trong Compass, mở `taskflow` và Drop 3 collection `tasks`, `projects`, `reminders` — **giữ lại `users`**. Đăng nhập vẫn dùng được, chỉ task/project/reminder là trống.
