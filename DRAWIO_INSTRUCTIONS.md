# HƯỚNG DẪN VẼ CLASS DIAGRAM TRONG DRAW.IO

## Cách 1: Import PlantUML File (Khuyên dùng)

### Bước 1: Mở Draw.io
1. Truy cập https://app.diagrams.net/ (hoặc mở draw.io desktop app)
2. Tạo diagram mới: File → New Blank Diagram

### Bước 2: Import PlantUML
1. Vào **Extras → Plugins**
2. Thêm plugin PlantUML: `https://www.plantuml.com/plantuml.js`
3. Nhấn **Apply**
4. Vào **File → Import from → Device** 
5. Chọn file `class-diagram.puml` đã tạo
6. Draw.io sẽ tự động render class diagram từ PlantUML!

## Cách 2: Vẽ thủ công trong Draw.io

### Bước 1: Tạo Class Diagram mới
1. Mở Draw.io
2. Chọn template: **Software → UML Class**
3. Hoặc tạo mới: **More Shapes → Software → UML Class**

### Bước 2: Kéo thả các thành phần UML
Từ panel bên trái, kéo các thành phần:
- **Class**: Kéo class vào canvas
- **Interface**: Cho các interface
- **Package**: Để nhóm các class theo service

### Bước 3: Thêm thuộc tính và phương thức
1. **Double-click** vào class box
2. Thêm thuộc tính (attributes):
   - Format: `+ name: type` (public)
   - Format: `- name: type` (private)
   - Format: `# name: type` (protected)
3. Thêm phương thức (methods):
   - Format: `+ methodName(param: type): ReturnType`
   - Format: `- methodName(param: type): ReturnType`
   - Format: `# methodName(param: type): ReturnType`

### Bước 4: Tạo Relationships
Kéo từ một class đến class khác để tạo relationship:
- **Association** (mũi tên đơn): Cho mối quan hệ thông thường
- **Aggregation** (hình thoi rỗng + mũi tên): Cho "has-a" relationship
- **Composition** (hình thoi đầy + mũi tên): Cho "owns" relationship
- **Dependency** (mũi tên đứt nét): Cho dependency relationship

### Bước 5: Thêm Multiplicity
1. Click vào relationship line
2. Trong panel bên phải, thêm labels:
   - `1` (one)
   - `1..*` (one or many)
   - `0..1` (zero or one)
   - `0..*` (zero or many)
   - `*` (many)

### Bước 6: Group theo Package
1. Vẽ **Package** từ shapes panel
2. Kéo các class vào trong package
3. Đặt tên package (vd: "Identity Service", "Conference Service")

## Cách 3: Sử dụng Auto-Layout (Nhanh nhất)

### Nếu đã có file PlantUML:
1. Import PlantUML như **Cách 1**
2. Sau khi import, chọn tất cả (Ctrl+A)
3. Vào **Arrange → Layout → Hierarchical** (hoặc **Organic**)
4. Draw.io sẽ tự động sắp xếp các class đẹp hơn!

## Tips và Tricks

### 1. Màu sắc theo Service:
- Chọn package → Fill color:
  - Identity Service: #ADD8E6 (Light Blue)
  - Conference Service: #FFFFE0 (Light Yellow)
  - Submission Service: #90EE90 (Light Green)
  - Review Service: #F08080 (Light Coral)
  - Integration: #D3D3D3 (Light Gray)

### 2. Ký hiệu Visibility trong Draw.io:
Khi nhập text trong class box, dùng ký hiệu:
- `+` cho public (hoặc chọn icon hình mắt trong format toolbar)
- `-` cho private (hoặc icon hình khóa)
- `#` cho protected (hoặc icon hình bánh răng)

### 3. Format nhanh:
- **Ctrl+B**: Bold
- **Ctrl+I**: Italic
- **Ctrl+U**: Underline
- Select text → Format toolbar: Font size, color

### 4. Tự động căn chỉnh:
- **Ctrl+A**: Select all
- **Arrange → Align**: Căn chỉnh các class
- **Arrange → Distribute**: Phân bố đều

### 5. Export diagram:
- **File → Export as → PNG/JPG/SVG/PDF**
- Độ phân giải cao: Chọn "Zoom" → 200% hoặc 300%

## File tham khảo
- `class-diagram.puml`: PlantUML format (có thể import vào draw.io)
- `UML_CLASS_DIAGRAM_PROMPT.md`: Prompt chi tiết các class và methods

## Lưu ý
- File PlantUML có thể rất lớn nếu có nhiều class
- Nếu import bị lỗi, thử vẽ thủ công từ prompt
- Có thể chia nhỏ diagram thành nhiều file (theo từng service)
