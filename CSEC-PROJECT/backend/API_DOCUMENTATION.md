# አሳሽ AI RAG API Documentation

This document provides details for all available endpoints in the አሳሽ AI Backend.

Base URL: http://localhost:5000

Authentication: JWT Bearer Token required for most endpoints. 
---

## 🔐 Authentication Endpoints

### 1. Register User
- **Endpoint:** `POST /api/auth/signup`
- **Access:** Public
- **Body:**
```json
{
    "name": "Full Name",
    "email": "email@astu.edu",
    "universityId": "ugr/XXXXX/XX",
    "password": "min-6-characters",
    "role": "student" // optional: student, admin, staff
}
```

### 2. Login User
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Body:**
```json
{
    "email": "email@astu.edu",
    "password": "your-password"
}
```
- **Note:** Returns a JWT token used for authorized requests.

### 3. Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Access:** Private (Auth Required)
- **Headers:** `Authorization: Bearer {{token}}`

### 4. Update Profile
- **Endpoint:** `PUT /api/auth/profile`
- **Access:** Private (Auth Required)
- **Body:**
```json
{
    "name": "New Name",
    "email": "new-email@astu.edu"
}
```

---

## 🤖 Chat & RAG Endpoints

### 5. Ask Chatbot
- **Endpoint:** `POST /api/chat/ask`
- **Access:** Private (Auth Required)
- **Body:**
```json
{
    "question": "Your question here"
}
```
- **Description:** Uses vector similarity search (Voyage AI) to find context and generates a response using Google Gemini.

### 6. Upload Text Document
- **Endpoint:** `POST /api/chat/upload/text`
- **Access:** Private (Admin/Staff only)
- **Body:**
```json
{
    "title": "Document Title",
    "content": "Full document text content...",
    "category": "safety", // safety, emergency, policy, procedure, resource, other
    "tags": ["tag1", "tag2"]
}
```

### 7. Upload File (PDF/TXT)
- **Endpoint:** `POST /api/chat/upload/file`
- **Access:** Private (Admin/Staff only)
- **Format:** `multipart/form-data`
- **Fields:**
  - `file`: (PDF or TXT file)
  - `title`: (Optional title)
  - `category`: (Optional category)

### 8. Get Documents
- **Endpoint:** `GET /api/chat/documents`
- **Access:** Private (Auth Required)
- **Query Params:** `page`, `limit`, `category`, `includeChunks`

### 9. Delete Document
- **Endpoint:** `DELETE /api/chat/documents/:id`
- **Access:** Private (Admin/Staff only)

---

## 🛠️ System Endpoints

### 10. Health Check
- **Endpoint:** `GET /`
- **Access:** Public

### 11. API Status
- **Endpoint:** `GET /api/status`
- **Access:** Public
