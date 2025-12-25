# 🧪 HƯỚNG DẪN TEST PHASE 2 - AUTHENTICATION

## 📋 Checklist Testing

### ✅ **STEP 1: Khởi động Server**

```bash
cd backend
npm run start:dev
```

**Kiểm tra:**

- ✅ Server chạy ở port 3000
- ✅ Kết nối MongoDB thành công
- ✅ Không có lỗi compile

**Output mong đợi:**

```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] ConfigModule dependencies initialized
[Nest] INFO [InstanceLoader] MongooseModule dependencies initialized
[Nest] INFO [InstanceLoader] UsersModule dependencies initialized
[Nest] INFO [InstanceLoader] AuthModule dependencies initialized
[Nest] INFO [NestApplication] Nest application successfully started
```

---

## 🔐 **STEP 2: Test Authentication Endpoints**

### **2.1: Test Register (POST /auth/register)**

**Request:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test1234",
    "displayName": "Test User"
  }'
```

**Expected Response (201):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "676c...",
    "email": "test@example.com",
    "username": "testuser",
    "displayName": "Test User",
    "authProvider": "local",
    "isEmailVerified": false,
    "isOnline": false
  }
}
```

**✅ Kiểm tra:**

- Nhận được accessToken
- User object không chứa password
- authProvider = "local"

---

### **2.2: Test Login (POST /auth/login)**

**Request:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected Response (200):**

```json
{
  "accessToken": "eyJhbGci...",
  "user": { ... }
}
```

**✅ Kiểm tra:**

- Login với email thành công
- Login với username thành công
- Nhận được token mới

---

### **2.3: Test Get Profile (GET /auth/profile)**

**Lưu token từ login response, sau đó:**

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200):**

```json
{
  "id": "676c...",
  "email": "test@example.com",
  "username": "testuser",
  ...
}
```

**✅ Kiểm tra:**

- Không có token → 401 Unauthorized
- Token hợp lệ → trả về user info
- Không có password trong response

---

### **2.4: Test Update Profile (PATCH /users/profile)**

```bash
curl -X PATCH http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

**Expected Response (200):**

```json
{
  "id": "676c...",
  "displayName": "Updated Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  ...
}
```

---

## 🌐 **STEP 3: Test Google OAuth**

### **3.1: Mở browser và navigate to:**

```
http://localhost:3000/auth/google
```

### **3.2: Luồng xử lý:**

1. Redirect đến Google login page
2. Chọn Google account
3. Consent permissions
4. Redirect về: `http://localhost:5173?token=eyJhbGci...`

**✅ Kiểm tra:**

- Google login page hiển thị
- Sau khi login, redirect về frontend với token
- Token hợp lệ khi dùng cho /auth/profile

**Test token từ Google:**

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer TOKEN_FROM_GOOGLE_REDIRECT"
```

---

## ❌ **STEP 4: Test Error Handling**

### **4.1: Test Duplicate Email**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "newuser",
    "password": "Test1234"
  }'
```

**Expected Response (409):**

```json
{
  "statusCode": 409,
  "message": "Email đã tồn tại"
}
```

---

### **4.2: Test Invalid Password**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Response (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### **4.3: Test Weak Password**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "username": "weakuser",
    "password": "123"
  }'
```

**Expected Response (400):**

```json
{
  "statusCode": 400,
  "message": [
    "Password phải có ít nhất 8 ký tự",
    "Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
  ]
}
```

---

### **4.4: Test Invalid Email Format**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "username": "testuser2",
    "password": "Test1234"
  }'
```

**Expected Response (400):**

```json
{
  "statusCode": 400,
  "message": ["Email không hợp lệ"]
}
```

---

### **4.5: Test Unauthorized Access**

```bash
curl -X GET http://localhost:3000/auth/profile
```

**Expected Response (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🔍 **STEP 5: Kiểm tra Database**

### **MongoDB Compass hoặc mongosh:**

```bash
# Connect to MongoDB
mongosh "mongodb+srv://nxb152:nxb152@securechat.zevm4vx.mongodb.net/"

# Switch to database
use securechat

# Check users
db.users.find().pretty()
```

**✅ Kiểm tra:**

- Password được hash (không phải plaintext)
- Email được lowercase
- authProvider = "local" hoặc "google"
- Timestamps (createdAt, updatedAt) tồn tại
- googleId chỉ có với Google users

---

## 📊 **STEP 6: Test Summary Checklist**

### **Authentication Flow:**

- [ ] ✅ Register với email/password thành công
- [ ] ✅ Login với email thành công
- [ ] ✅ Login với username thành công
- [ ] ✅ JWT token được generate
- [ ] ✅ Protected routes yêu cầu token
- [ ] ✅ Token validation hoạt động

### **Google OAuth:**

- [ ] ✅ Redirect to Google thành công
- [ ] ✅ Callback xử lý thành công
- [ ] ✅ User được tạo/update trong DB
- [ ] ✅ Token được redirect về frontend

### **Validation:**

- [ ] ✅ Email format validation
- [ ] ✅ Password strength validation
- [ ] ✅ Username validation
- [ ] ✅ Duplicate email check
- [ ] ✅ Duplicate username check

### **Security:**

- [ ] ✅ Password được hash
- [ ] ✅ Password không xuất hiện trong response
- [ ] ✅ googleId không xuất hiện trong response
- [ ] ✅ Invalid credentials trả về 401
- [ ] ✅ Missing token trả về 401

### **Error Handling:**

- [ ] ✅ 400 - Validation errors
- [ ] ✅ 401 - Invalid credentials/Unauthorized
- [ ] ✅ 409 - Duplicate email/username
- [ ] ✅ 404 - User not found

---

## 🎯 **Expected Results:**

**Nếu tất cả tests PASS:**

```
✅ Phase 2 - Authentication HOÀN THÀNH
✅ Ready to move to Phase 3 - Key Management
```

**Nếu có lỗi:**

1. Check console logs
2. Check MongoDB connection
3. Check environment variables (.env)
4. Check JWT secret configuration
5. Check Google OAuth credentials

---

## 🐛 **Common Issues & Solutions:**

### **Issue 1: Cannot connect to MongoDB**

```
Solution: Kiểm tra DATABASE_URL trong .env
Verify MongoDB Atlas whitelist IP
```

### **Issue 2: 401 Unauthorized**

```
Solution:
- Copy đúng token từ login response
- Token format: "Bearer <token>"
- Check JWT_SECRET in .env
```

### **Issue 3: Google OAuth redirect error**

```
Solution:
- Check GOOGLE_CALLBACK_URL matches Google Console
- Verify FRONTEND_URL is correct
- Add authorized redirect URIs in Google Console
```

### **Issue 4: Validation errors**

```
Solution:
- Password must be 8+ chars with uppercase, lowercase, number
- Email must be valid format
- Username must be 3+ chars, alphanumeric only
```

---

## 🚀 **Next Steps:**

Sau khi Phase 2 hoàn thành:

1. ✅ Move to Phase 3: Key Management (ECDH & ECDSA)
2. ✅ Implement WebSocket for real-time chat
3. ✅ Add end-to-end encryption
