# Script trao đổi với giảng viên — SmartParking

> Mục tiêu file này: giúp nhóm có sẵn nội dung để trình bày với cô về actor, business role và luồng nghiệp vụ chính của hệ thống SmartParking.

---

## 1. Mở đầu khi trình bày

**Em chào cô. Nhóm em đang làm đề tài SmartParking — hệ thống quản lý bãi xe thông minh cho tòa nhà.**

Vấn đề nhóm em muốn giải quyết là: trong các bãi xe nhiều tầng, nếu quản lý thủ công thì dễ bị ùn tắc ở cổng, khó biết slot nào còn trống, khó tính phí chính xác và khó thống kê doanh thu. Vì vậy hệ thống của nhóm em tập trung vào các chức năng chính như:

- Quản lý xe vào / xe ra.
- Tự động gợi ý chỗ đỗ phù hợp.
- Cập nhật trạng thái slot theo thời gian thực.
- Tính phí gửi xe tự động.
- Hỗ trợ đặt chỗ trước và thanh toán.
- Hỗ trợ báo cáo cho quản lý.

Hệ thống của nhóm em có 4 actor chính:

1. **System Admin** — quản trị tài khoản và phân quyền.
2. **Parking Manager** — quản lý vận hành bãi xe.
3. **Parking Staff** — nhân viên xử lý xe vào / xe ra tại cổng.
4. **Parking Driver** — người gửi xe, có thể xem bãi, đặt chỗ, thanh toán.

---

## 2. Tổng quan actor trong hệ thống

| Actor | Vai trò nghiệp vụ | Mục tiêu chính |
|---|---|---|
| System Admin | Quản trị hệ thống | Tạo tài khoản, phân quyền, khóa/mở tài khoản |
| Parking Manager | Quản lý vận hành | Cấu hình bãi xe, bảng giá, xem báo cáo |
| Parking Staff | Xử lý nghiệp vụ tại cổng | Check-in, check-out, xử lý ngoại lệ |
| Parking Driver | Người sử dụng dịch vụ gửi xe | Xem slot trống, đặt chỗ, theo dõi phiên gửi xe, thanh toán |

---

## 3. Actor 1 — System Admin

### 3.1 Business role

**System Admin** là người có quyền cao nhất trong hệ thống. Actor này không trực tiếp xử lý xe vào ra, mà chịu trách nhiệm quản trị người dùng và phân quyền.

Nói cách khác, Admin đảm bảo rằng đúng người có đúng quyền:

- Manager được quyền xem báo cáo và cấu hình bãi xe.
- Staff được quyền xử lý xe vào / xe ra.
- Driver chỉ được quyền xem thông tin, đặt chỗ, thanh toán.

### 3.2 Chức năng chính

- Tạo tài khoản người dùng.
- Khóa hoặc mở khóa tài khoản.
- Gán role cho người dùng: ADMIN, MANAGER, STAFF, DRIVER.
- Cấu hình một số thông số hệ thống nếu cần.
 
### 3.3 Luồng nghiệp vụ mẫu

**Luồng: Admin tạo tài khoản nhân viên mới**

1. Admin đăng nhập vào hệ thống.
2. Admin vào màn hình quản lý tài khoản.
3. Admin chọn “Thêm tài khoản”.
4. Admin nhập thông tin: họ tên, email, mật khẩu tạm thời, số điện thoại, role.
5. Hệ thống kiểm tra email đã tồn tại chưa.
6. Nếu hợp lệ, hệ thống tạo tài khoản mới.
7. Nhân viên mới có thể đăng nhập theo role được cấp.

### 3.4 Câu nói khi trình bày với cô

**Với actor Admin, nhóm em xác định đây là vai trò quản trị hệ thống. Admin không xử lý nghiệp vụ gửi xe trực tiếp, mà chịu trách nhiệm tạo tài khoản, khóa/mở tài khoản và phân quyền cho các actor còn lại. Điều này giúp hệ thống có kiểm soát truy cập rõ ràng theo từng vai trò.**

---

## 4. Actor 2 — Parking Manager

### 4.1 Business role

**Parking Manager** là người quản lý vận hành bãi xe. Actor này chịu trách nhiệm cấu hình dữ liệu nền của bãi xe và theo dõi hiệu quả hoạt động.

Manager quan tâm các câu hỏi như:

- Bãi xe còn bao nhiêu slot trống?
- Hôm nay có bao nhiêu xe vào / ra?
- Doanh thu hôm nay, tuần này, tháng này là bao nhiêu?
- Tầng nào đang đầy?
- Khung giờ nào là giờ cao điểm?
- Bảng giá hiện tại có cần điều chỉnh không?

### 4.2 Chức năng chính

- Quản lý thông tin tòa nhà.
- Quản lý tầng.
- Quản lý slot.
- Quản lý loại xe.
- Quản lý cổng vào / ra.
- Quản lý bảng giá.
- Xem báo cáo và thống kê.
- Theo dõi ngoại lệ nếu có.

### 4.3 Luồng nghiệp vụ mẫu 1 — Cấu hình bãi xe

1. Manager đăng nhập vào hệ thống.
2. Manager vào phần cấu hình tòa nhà.
3. Manager tạo hoặc cập nhật thông tin tòa nhà: tên, địa chỉ, giờ hoạt động.
4. Manager tạo các tầng, ví dụ: B1, B2, T1.
5. Manager tạo các slot cho từng tầng, ví dụ: B1-A01, B1-A02.
6. Manager gán loại xe cho từng slot: xe máy, ô tô, xe điện.
7. Hệ thống lưu cấu hình và hiển thị trên sơ đồ bãi xe.

### 4.4 Luồng nghiệp vụ mẫu 2 — Cấu hình bảng giá

1. Manager vào màn hình quản lý bảng giá.
2. Manager chọn loại xe, ví dụ: xe máy.
3. Manager nhập đơn giá, ví dụ: 5.000đ/giờ.
4. Manager nhập số phút miễn phí nếu có.
5. Hệ thống lưu bảng giá.
6. Khi Staff check-out xe, hệ thống dùng bảng giá này để tính phí.

### 4.5 Luồng nghiệp vụ mẫu 3 — Xem báo cáo

1. Manager đăng nhập vào dashboard.
2. Manager chọn khoảng thời gian cần xem, ví dụ: hôm nay hoặc tháng này.
3. Hệ thống thống kê số lượt xe vào, số lượt xe ra, doanh thu, tỷ lệ lấp đầy.
4. Manager xem biểu đồ hoặc bảng số liệu.
5. Manager dùng dữ liệu này để đánh giá tình hình vận hành.

### 4.6 Câu nói khi trình bày với cô

**Với actor Manager, nhóm em định nghĩa đây là người quản lý vận hành bãi xe. Manager không đứng ở cổng xử lý từng xe, mà quản lý dữ liệu nền như tầng, slot, cổng, bảng giá và theo dõi báo cáo. Vai trò này giúp hệ thống không chỉ xử lý giao dịch hằng ngày mà còn hỗ trợ quản trị và ra quyết định.**

---

## 5. Actor 3 — Parking Staff

### 5.1 Business role

**Parking Staff** là nhân viên vận hành tại cổng. Đây là actor sử dụng hệ thống nhiều nhất trong nghiệp vụ hằng ngày.

Staff chịu trách nhiệm:

- Nhập thông tin xe khi xe vào.
- Xác nhận slot hệ thống gợi ý.
- Tạo phiên gửi xe.
- Tìm phiên gửi xe khi xe ra.
- Xác nhận thanh toán.
- Xử lý các trường hợp bất thường như mất vé, sai biển số.

### 5.2 Chức năng chính

- Chọn cổng làm việc.
- Check-in xe vào bãi.
- Check-out xe ra khỏi bãi.
- Xem phiên gửi xe đang hoạt động.
- Xử lý ngoại lệ.

### 5.3 Luồng nghiệp vụ chính — Xe vào bãi / Check-in

**Bối cảnh:** Một xe đến cổng vào, Staff cần tạo phiên gửi xe và hướng dẫn xe đến slot phù hợp.

1. Staff đăng nhập vào hệ thống.
2. Staff chọn cổng đang trực, ví dụ: Cổng A.
3. Xe đến cổng vào.
4. Staff nhập biển số xe.
5. Staff chọn loại xe: xe máy hoặc ô tô.
6. Hệ thống kiểm tra dữ liệu đầu vào.
7. Hệ thống tìm danh sách slot còn trống phù hợp với loại xe.
8. Thuật toán gợi ý slot tối ưu dựa trên các tiêu chí như:
   - Đúng loại xe.
   - Slot còn trống.
   - Tầng phù hợp.
   - Khoảng cách đến cổng.
   - Cân bằng tải giữa các tầng.
9. Hệ thống trả về slot được đề xuất, ví dụ: B1-A01.
10. Staff xác nhận.
11. Hệ thống tạo parking session.
12. Hệ thống cập nhật slot từ AVAILABLE sang OCCUPIED.
13. Hệ thống trả về mã phiên / mã vé và hướng dẫn vị trí đỗ.

### 5.4 Luồng nghiệp vụ chính — Xe ra bãi / Check-out

**Bối cảnh:** Xe chuẩn bị rời bãi, Staff cần tìm phiên gửi xe, tính phí và kết thúc phiên.

1. Staff đăng nhập vào hệ thống.
2. Staff chọn cổng ra đang trực.
3. Tài xế đưa mã vé hoặc đọc biển số xe.
4. Staff nhập mã vé hoặc biển số.
5. Hệ thống tìm parking session đang ACTIVE.
6. Hệ thống lấy thời gian vào và thời gian hiện tại.
7. Hệ thống tính thời lượng gửi xe.
8. Hệ thống áp dụng bảng giá để tính tổng phí.
9. Staff xác nhận đã thu tiền hoặc xác nhận phương thức thanh toán.
10. Hệ thống cập nhật session sang COMPLETED.
11. Hệ thống cập nhật slot từ OCCUPIED về AVAILABLE.
12. Hệ thống tạo thông tin hóa đơn / payment.

### 5.5 Luồng nghiệp vụ ngoại lệ — Mất vé

1. Driver báo mất vé.
2. Staff mở chức năng xử lý ngoại lệ.
3. Staff nhập biển số xe và thông tin xác minh.
4. Hệ thống tìm session liên quan.
5. Staff xác nhận thông tin xe.
6. Hệ thống tạo exception log loại LOST_TICKET.
7. Hệ thống có thể tính thêm phí phạt nếu quy định.
8. Staff hoàn tất xử lý check-out.

### 5.6 Câu nói khi trình bày với cô

**Với actor Staff, đây là vai trò trực tiếp vận hành tại cổng. Luồng quan trọng nhất là check-in và check-out. Khi xe vào, Staff nhập biển số và loại xe, hệ thống tự gợi ý slot tốt nhất rồi tạo phiên gửi xe. Khi xe ra, Staff tìm phiên gửi xe, hệ thống tính phí tự động, sau đó giải phóng slot. Như vậy Staff thao tác đơn giản hơn, còn hệ thống đảm bảo dữ liệu slot và doanh thu được cập nhật chính xác.**

---

## 6. Actor 4 — Parking Driver

### 6.1 Business role

**Parking Driver** là người gửi xe. Actor này tương tác với hệ thống ở góc độ khách hàng.

Driver cần biết:

- Bãi xe còn chỗ hay không.
- Giá gửi xe là bao nhiêu.
- Có thể đặt chỗ trước không.
- Xe của mình đang đỗ ở đâu.
- Phí tạm tính hiện tại là bao nhiêu.
- Có thể thanh toán online không.

### 6.2 Chức năng chính

- Đăng ký tài khoản.
- Đăng nhập.
- Xem thông tin bãi xe công khai.
- Xem số slot trống real-time.
- Đặt chỗ trước.
- Theo dõi phiên gửi xe.
- Thanh toán online.
- Xem lịch sử gửi xe.
- Mua vé tháng nếu có.

### 6.3 Luồng nghiệp vụ mẫu 1 — Xem thông tin bãi xe

1. Driver mở website.
2. Driver vào trang xem thông tin bãi xe.
3. Hệ thống hiển thị thông tin tòa nhà, giờ hoạt động, bảng giá.
4. Hệ thống hiển thị số slot trống theo từng tầng.
5. Driver quyết định có đến bãi xe hay không.

### 6.4 Luồng nghiệp vụ mẫu 2 — Đăng ký tài khoản

1. Driver mở trang đăng ký.
2. Driver nhập họ tên, email, mật khẩu, số điện thoại.
3. Hệ thống kiểm tra email đã tồn tại chưa.
4. Hệ thống kiểm tra định dạng email và mật khẩu.
5. Nếu hợp lệ, hệ thống tạo tài khoản Driver.
6. Driver đăng nhập vào hệ thống.

### 6.5 Luồng nghiệp vụ mẫu 3 — Đặt chỗ trước

1. Driver đăng nhập vào hệ thống.
2. Driver vào trang đặt chỗ.
3. Driver chọn loại xe và thời gian dự kiến đến.
4. Hệ thống hiển thị các slot phù hợp còn trống.
5. Driver chọn slot muốn đặt.
6. Hệ thống giữ slot trong một khoảng thời gian nhất định.
7. Driver xác nhận đặt chỗ.
8. Hệ thống tạo reservation.
9. Slot chuyển từ AVAILABLE sang RESERVED.
10. Driver nhận mã đặt chỗ.

### 6.6 Luồng nghiệp vụ mẫu 4 — Theo dõi phiên gửi xe

1. Driver đăng nhập vào hệ thống.
2. Driver vào trang phiên gửi xe.
3. Hệ thống hiển thị xe đang gửi, slot đang đỗ, giờ vào.
4. Hệ thống hiển thị phí tạm tính theo thời gian.
5. Driver có thể chuẩn bị thanh toán khi chuẩn bị rời bãi.

### 6.7 Luồng nghiệp vụ mẫu 5 — Thanh toán online

1. Driver vào trang thanh toán.
2. Hệ thống hiển thị số tiền cần trả.
3. Driver chọn phương thức thanh toán: VNPay, Momo hoặc QR.
4. Driver thực hiện thanh toán ở môi trường sandbox.
5. Hệ thống nhận kết quả thanh toán.
6. Payment được cập nhật sang COMPLETED.
7. Driver có thể rời bãi sau khi Staff xác nhận hoặc hệ thống xác nhận.

### 6.8 Câu nói khi trình bày với cô

**Với actor Driver, nhóm em xem đây là khách hàng sử dụng dịch vụ gửi xe. Driver có thể xem tình trạng bãi xe trước khi đến, đăng ký tài khoản, đặt chỗ trước, theo dõi phiên gửi xe và thanh toán online. Vai trò này giúp hệ thống không chỉ phục vụ nhân viên nội bộ mà còn tăng trải nghiệm cho người gửi xe.**

---

## 7. Luồng tổng thể của hệ thống

### 7.1 Luồng vận hành hằng ngày

1. Admin tạo tài khoản cho Manager và Staff.
2. Manager cấu hình tòa nhà, tầng, slot, cổng và bảng giá.
3. Staff đăng nhập và chọn cổng làm việc.
4. Driver đến gửi xe hoặc xem thông tin bãi xe trước.
5. Khi xe vào, Staff check-in xe.
6. Hệ thống gợi ý slot và tạo parking session.
7. Slot được cập nhật trạng thái real-time.
8. Khi xe ra, Staff check-out xe.
9. Hệ thống tính phí và tạo payment.
10. Slot được giải phóng.
11. Manager xem báo cáo doanh thu và tình trạng vận hành.

### 7.2 Luồng từ góc nhìn dữ liệu

1. Người dùng đăng nhập → hệ thống xác thực JWT.
2. Request đi vào controller.
3. Controller gọi service xử lý nghiệp vụ.
4. Service gọi repository để truy vấn database.
5. Database lưu trạng thái users, slots, sessions, payments.
6. Nếu trạng thái slot thay đổi, hệ thống gửi cập nhật real-time cho frontend.

### 7.3 Câu nói khi trình bày với cô

**Luồng tổng thể của nhóm em là: Admin tạo tài khoản, Manager cấu hình bãi xe, Staff xử lý xe vào ra, Driver sử dụng dịch vụ. Các nghiệp vụ đều xoay quanh đối tượng chính là parking session. Khi xe vào thì tạo session và chiếm slot; khi xe ra thì hoàn tất session, tính phí và giải phóng slot.**

---

## 8. Business rules chính

### 8.1 Rule về phân quyền

- Admin được quản lý tài khoản và phân quyền.
- Manager được quản lý cấu hình và xem báo cáo.
- Staff được xử lý check-in/check-out và ngoại lệ.
- Driver được xem thông tin, đặt chỗ, thanh toán và xem lịch sử của chính mình.

### 8.2 Rule về slot

- Một slot chỉ có thể ở một trong các trạng thái chính:
  - AVAILABLE: còn trống.
  - OCCUPIED: đang có xe.
  - RESERVED: đã được đặt trước.
  - MAINTENANCE: đang bảo trì.
  - LOCKED: đang bị khóa tạm thời.
- Xe chỉ được gán vào slot phù hợp với loại xe.
- Một slot không được gán cho hai xe cùng lúc.

### 8.3 Rule về parking session

- Khi xe vào, hệ thống tạo một parking session ở trạng thái ACTIVE.
- Một xe đang gửi trong bãi sẽ có một session đang ACTIVE.
- Khi xe ra, session được cập nhật thành COMPLETED.
- Session lưu các thông tin như biển số, giờ vào, giờ ra, slot, phí.

### 8.4 Rule về tính phí

- Phí được tính dựa trên thời gian gửi xe và bảng giá.
- Bảng giá phụ thuộc vào loại xe và hình thức tính phí.
- Nếu có số phút miễn phí, hệ thống trừ phần miễn phí trước khi tính tiền.
- Hệ thống làm tròn theo block giờ nếu áp dụng tính theo giờ.

### 8.5 Rule về đặt chỗ

- Driver chỉ đặt được slot còn trống.
- Khi đặt chỗ thành công, slot chuyển sang RESERVED.
- Nếu quá thời gian giữ chỗ mà Driver không đến, reservation có thể bị hủy và slot quay lại AVAILABLE.

### 8.6 Rule về ngoại lệ

- Các trường hợp như mất vé, sai biển số, quá hạn, đỗ sai khu vực phải được ghi log.
- Staff là người xử lý ngoại lệ.
- Manager có thể xem lại các ngoại lệ để quản lý vận hành.

---

## 9. Các câu hỏi cô có thể hỏi và gợi ý trả lời  

### Câu 1: Vì sao hệ thống cần nhiều actor như vậy?

**Gợi ý trả lời:**

Vì trong thực tế bãi xe có nhiều nhóm người dùng với trách nhiệm khác nhau. Admin quản lý tài khoản, Manager quản lý vận hành, Staff xử lý xe vào ra tại cổng, còn Driver là người gửi xe. Nếu tách actor rõ thì hệ thống dễ phân quyền, dễ thiết kế chức năng và tránh việc một user có quá nhiều quyền không cần thiết.

### Câu 2: Actor nào là actor chính?

**Gợi ý trả lời:**

Actor vận hành chính là Parking Staff vì Staff xử lý nghiệp vụ cốt lõi là check-in và check-out. Tuy nhiên về mặt quản lý hệ thống, Manager cũng rất quan trọng vì Manager cấu hình dữ liệu nền như slot, cổng và bảng giá.

### Câu 3: Đối tượng nghiệp vụ trung tâm của hệ thống là gì?

**Gợi ý trả lời:**

Đối tượng trung tâm là Parking Session, tức là một lượt gửi xe từ lúc xe vào đến lúc xe ra. Khi check-in thì tạo session, khi check-out thì hoàn tất session, tính phí và giải phóng slot.

### Câu 4: AI trong hệ thống nằm ở đâu?

**Gợi ý trả lời:**

AI trong hệ thống nằm ở phần gợi ý slot tối ưu. Khi Staff nhập biển số và loại xe, hệ thống tìm các slot còn trống phù hợp rồi chấm điểm dựa trên các tiêu chí như loại xe, tầng, khoảng cách tới cổng và tình trạng lấp đầy. Sau đó hệ thống đề xuất slot tốt nhất.

### Câu 5: Làm sao tránh hai xe bị gán cùng một slot?

**Gợi ý trả lời:**

Nhóm em xử lý bằng transaction database và có thể dùng Redis lock trong lúc check-in. Khi một request đang giữ slot, request khác không thể đồng thời lấy cùng slot đó. Sau khi tạo session thành công, trạng thái slot được cập nhật sang OCCUPIED.

### Câu 6: Driver có bắt buộc đăng nhập không?

**Gợi ý trả lời:**

Không phải chức năng nào cũng cần đăng nhập. Driver có thể xem thông tin bãi xe công khai mà không cần đăng nhập. Nhưng nếu muốn đặt chỗ, theo dõi phiên gửi xe, thanh toán online hoặc xem lịch sử thì cần đăng nhập để hệ thống biết đó là user nào.

### Câu 7: Manager khác Admin ở điểm nào?

**Gợi ý trả lời:**

Admin quản lý tài khoản và phân quyền, còn Manager quản lý nghiệp vụ vận hành của bãi xe như tầng, slot, cổng, bảng giá và báo cáo. Admin thiên về quản trị hệ thống, Manager thiên về quản lý hoạt động kinh doanh.

### Câu 8: Staff có được sửa bảng giá không?

**Gợi ý trả lời:**

Không. Staff chỉ xử lý xe vào, xe ra và ngoại lệ tại cổng. Bảng giá thuộc quyền của Manager vì đây là cấu hình kinh doanh của bãi xe.

### Câu 9: Khi mất vé thì xử lý thế nào?

**Gợi ý trả lời:**

Staff sẽ dùng chức năng xử lý ngoại lệ, nhập biển số hoặc thông tin xác minh, tìm session đang active, tạo exception log loại LOST_TICKET, sau đó tính phí và có thể cộng thêm phí phạt theo quy định.

### Câu 10: Hệ thống có real-time không?

**Gợi ý trả lời:**

Có. Khi slot thay đổi trạng thái, ví dụ từ AVAILABLE sang OCCUPIED hoặc ngược lại, backend có thể broadcast thông tin qua WebSocket để frontend cập nhật sơ đồ bãi xe real-time.

---

## 10. Script nói ngắn gọn trong 2–3 phút

**Em chào cô. Nhóm em làm đề tài SmartParking, là hệ thống quản lý bãi xe thông minh cho tòa nhà. Hệ thống giải quyết các vấn đề như quản lý xe vào ra, cập nhật slot trống, tính phí tự động và hỗ trợ báo cáo vận hành.**

**Hệ thống có 4 actor chính. Thứ nhất là System Admin, chịu trách nhiệm tạo tài khoản, khóa/mở tài khoản và phân quyền cho người dùng. Thứ hai là Parking Manager, chịu trách nhiệm quản lý vận hành như cấu hình tòa nhà, tầng, slot, cổng, bảng giá và xem báo cáo doanh thu. Thứ ba là Parking Staff, là nhân viên trực tiếp xử lý xe vào và xe ra tại cổng. Thứ tư là Parking Driver, là người gửi xe, có thể xem thông tin bãi xe, đặt chỗ trước, theo dõi phiên gửi xe và thanh toán online.**

**Luồng nghiệp vụ chính của hệ thống xoay quanh Parking Session. Khi xe vào, Staff nhập biển số và loại xe, hệ thống tìm slot phù hợp và gợi ý slot tối ưu. Sau khi Staff xác nhận, hệ thống tạo parking session và cập nhật slot sang trạng thái OCCUPIED. Khi xe ra, Staff nhập mã vé hoặc biển số, hệ thống tìm session đang active, tính phí dựa trên thời gian gửi và bảng giá, sau đó hoàn tất session và giải phóng slot về AVAILABLE.**

**Về business rule, mỗi role có quyền riêng. Admin quản lý tài khoản, Manager quản lý cấu hình và báo cáo, Staff xử lý nghiệp vụ tại cổng, Driver sử dụng dịch vụ gửi xe. Một slot chỉ được gán cho một xe tại một thời điểm, và hệ thống có transaction hoặc lock để tránh trùng slot. Ngoài ra, trạng thái slot được cập nhật real-time để người dùng thấy chính xác tình trạng bãi xe.**

**Điểm nổi bật của hệ thống là có thuật toán gợi ý slot tối ưu, tính phí tự động, phân quyền bằng JWT/RBAC và hỗ trợ real-time slot map.**

---

## 11. Script nói chi tiết trong 5–7 phút

**Em chào cô. Nhóm em xin trình bày tổng quan về đề tài SmartParking — hệ thống quản lý bãi xe thông minh cho tòa nhà. Lý do nhóm em chọn đề tài này là vì trong thực tế, các bãi xe nhiều tầng thường gặp các vấn đề như xe vào ra đông, khó biết chính xác slot nào còn trống, nhân viên phải xử lý thủ công và quản lý khó thống kê doanh thu. Vì vậy nhóm em xây dựng hệ thống web để hỗ trợ quản lý xe vào ra, gợi ý chỗ đỗ, tính phí và báo cáo.**

**Về actor, hệ thống có 4 actor chính. Actor đầu tiên là System Admin. Đây là người quản trị hệ thống, có quyền tạo tài khoản, khóa hoặc mở tài khoản và phân quyền cho người dùng. Admin không xử lý xe vào ra trực tiếp mà đảm bảo đúng người có đúng quyền trong hệ thống.**

**Actor thứ hai là Parking Manager. Đây là người quản lý vận hành bãi xe. Manager có thể cấu hình thông tin tòa nhà, tạo tầng, tạo slot, cấu hình cổng vào ra và thiết lập bảng giá. Ngoài ra Manager có thể xem báo cáo như số lượt xe vào ra, doanh thu, tỷ lệ lấp đầy từng tầng và khung giờ cao điểm. Vai trò này giúp hệ thống không chỉ xử lý giao dịch mà còn hỗ trợ quản lý kinh doanh.**

**Actor thứ ba là Parking Staff. Đây là nhân viên làm việc tại cổng và là actor xử lý nghiệp vụ hằng ngày nhiều nhất. Khi xe vào, Staff nhập biển số và loại xe, hệ thống sẽ tìm slot phù hợp và gợi ý slot tối ưu. Sau khi Staff xác nhận, hệ thống tạo parking session, cập nhật slot thành OCCUPIED và trả về mã vé hoặc hướng dẫn vị trí đỗ. Khi xe ra, Staff nhập mã vé hoặc biển số, hệ thống tìm session đang active, tính phí theo thời gian gửi và bảng giá, sau đó hoàn tất session và giải phóng slot.**

**Actor thứ tư là Parking Driver. Đây là người gửi xe. Driver có thể xem thông tin bãi xe như giờ hoạt động, bảng giá và số slot trống. Nếu đăng nhập, Driver có thể đặt chỗ trước, theo dõi phiên gửi xe, xem phí tạm tính, thanh toán online và xem lịch sử gửi xe.**

**Luồng nghiệp vụ trung tâm của hệ thống là Parking Session. Một Parking Session đại diện cho một lượt gửi xe từ lúc vào đến lúc ra. Khi check-in, hệ thống tạo session active và chiếm một slot. Khi check-out, hệ thống tính phí, cập nhật payment, hoàn tất session và giải phóng slot. Nhờ đó hệ thống kiểm soát được xe nào đang trong bãi, xe đó ở slot nào và phí là bao nhiêu.**

**Về business rule, hệ thống phân quyền rõ ràng. Admin quản lý user và role. Manager quản lý cấu hình và báo cáo. Staff chỉ xử lý nghiệp vụ tại cổng. Driver chỉ thao tác với thông tin và giao dịch của mình. Về slot, mỗi slot có trạng thái như AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE hoặc LOCKED. Một slot không được gán cho hai xe cùng lúc. Về tính phí, hệ thống dựa vào thời gian gửi xe, loại xe và bảng giá do Manager cấu hình.**

**Điểm nổi bật của nhóm em là phần gợi ý slot tối ưu. Khi xe vào, hệ thống không chọn slot ngẫu nhiên mà dựa trên các tiêu chí như đúng loại xe, slot còn trống, khoảng cách đến cổng, tầng phù hợp và cân bằng tải giữa các tầng. Ngoài ra hệ thống có cập nhật trạng thái slot real-time để frontend hiển thị sơ đồ bãi xe chính xác.**

**Tóm lại, hệ thống của nhóm em hướng đến việc số hóa quy trình vận hành bãi xe: từ cấu hình bãi xe, xử lý xe vào ra, tính phí, đặt chỗ, thanh toán cho đến báo cáo quản lý.**

---

## 12. Checklist trước khi gặp cô

Trước khi trao đổi với cô, nhóm nên thống nhất các điểm sau:

- [ ] Actor chính gồm những ai?
- [ ] Staff check-in/check-out như thế nào?
- [ ] Driver có những chức năng nào?
- [ ] Manager khác Admin ở điểm nào?
- [ ] Parking Session là gì?
- [ ] Slot có những trạng thái nào?
- [ ] Hệ thống tính phí theo rule nào?
- [ ] AI slot allocation có thật sự là AI hay là thuật toán scoring?
- [ ] Chức năng nào bắt buộc làm, chức năng nào optional?
- [ ] Demo lần đầu sẽ demo được luồng nào?

---

## 13. Gợi ý phân chia người nói khi gặp cô

### Minh An — Leader / Backend core

Nói về:

- Tổng quan project.
- Kiến trúc backend.
- Luồng check-in/check-out.
- Parking Session.
- Slot assignment.

### Duy Tùng — Backend Auth / Reservation / Payment

Nói về:

- Đăng nhập, đăng ký.
- JWT/RBAC.
- Đặt chỗ trước.
- Thanh toán.

### Khắc Toàn — Backend Report / Admin

Nói về:

- Database entities.
- Dữ liệu mẫu.
- Báo cáo thống kê.
- Quản trị bảng giá / nhân viên nếu được giao.

### Tá Thiên — Frontend chính

Nói về:

- Layout frontend.
- Trang login.
- Trang check-in/check-out.
- Slot map.

### Ngọc Quảng — Frontend Driver / QA

Nói về:

- Trang public xem bãi xe.
- Trang driver.
- Dashboard manager.
- Test cases và QA.

---

## 14. Kết luận khi trình bày

**Dạ, tóm lại hệ thống SmartParking của nhóm em có 4 actor chính: Admin, Manager, Staff và Driver. Mỗi actor có business role riêng và được phân quyền rõ ràng. Luồng nghiệp vụ cốt lõi là check-in/check-out thông qua Parking Session. Hệ thống hỗ trợ gợi ý slot, tính phí, cập nhật trạng thái real-time, đặt chỗ và báo cáo. Nhóm em sẽ ưu tiên hoàn thiện luồng login, check-in, check-out và slot map trước để có thể demo được phần lõi của hệ thống.**
