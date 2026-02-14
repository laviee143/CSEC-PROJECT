# አሳሽ AI - Backend API Reference

This document provides a comprehensive list of all available API routes, including request requirements, body fields, and authorization levels.

## Base URL
`http://localhost:5000/api`

## Authentication Routes `/api/auth`

### 1. Register User
*   **Endpoint:** `POST /signup`
*   **Description:** Register a new student or staff account.
*   **Access:** Public
*   **Request Body:**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `name` | String | Yes | User's full name (2-50 characters). |
    | `email` | String | Yes | Valid email address. |
    | `universityId` | String | Yes | ASTU ID (Format: `ugr/XXXXX/XX`). |
    | `password` | String | Yes | Minimum 6 characters. |
    | `role` | String | No | 'student' (default), 'admin', or 'staff'. |

### 2. Login User
*   **Endpoint:** `POST /login`
*   **Description:** Authenticate user and receive JWT token.
*   **Access:** Public
*   **Request Body:**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `email` | String | Yes | Registered email address. |
    | `password` | String | Yes | User's password. |

### 3. Get Current User
*   **Endpoint:** `GET /me`
*   **Description:** Retrieve profile information of the currently logged-in user.
*   **Access:** Private (Auth Token Required)
*   **Headers:** `Authorization: Bearer <token>`

### 4. Update Profile
*   **Endpoint:** `PUT /profile`
*   **Description:** Update name or email of the current user.
*   **Access:** Private (Auth Token Required)
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `name` | String | No | New name (2-50 characters). |
    | `email` | String | No | New valid email address. |

---

## Chat & RAG Routes `/api/chat`

### 1. Ask Question
*   **Endpoint:** `POST /ask`
*   **Description:** Submit a query to the AI assistant using vector search (RAG).
*   **Access:** Private (Auth Token Required)
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `question` | String | Yes | The user's query (3-1000 characters). |

### 2. Upload Document (Text)
*   **Endpoint:** `POST /upload/text`
*   **Description:** Manually upload administrative content for the knowledge base.
*   **Access:** Private (Admin/Staff only)
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `title` | String | Yes | Title of the process/document. |
    | `content` | String | Yes | Full text of the document (auto-chunks if >2000 chars). |
    | `category` | String | No | One of: 'safety', 'emergency', 'policy', 'procedure', 'resource', 'other'. |
    | `tags` | Array | No | List of strings for better search indexing. |

### 3. Upload Document (File)
*   **Endpoint:** `POST /upload/file`
*   **Description:** Upload a PDF or TXT file to be processed into the knowledge base.
*   **Access:** Private (Admin/Staff only)
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body (multipart/form-data):**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `file` | File | Yes | .pdf or .txt file (Max 10MB). |
    | `title` | String | No | Custom title (defaults to filename). |
    | `category` | String | No | As defined above. |
    | `tags` | Array | No | List of strings. |

### 4. List Documents
*   **Endpoint:** `GET /documents`
*   **Description:** Retrieve list of uploaded documents with optional filtering.
*   **Access:** Private (Auth Token Required)
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Parameters:**
    | Parameter | Type | Default | Description |
    | :--- | :--- | :--- | :--- |
    | `category` | String | - | Filter by category name. |
    | `search` | String | - | Keyword search in title/content. |
    | `limit` | Number | 20 | Items per page. |
    | `page` | Number | 1 | Page number. |
    | `includeChunks` | Boolean | false | Include document chunks in results. |

### 5. Delete Document
*   **Endpoint:** `DELETE /documents/:id`
*   **Description:** Permanently remove a document and its associated vector chunks.
*   **Access:** Private (Admin/Staff only)
*   **Headers:** `Authorization: Bearer <token>`
*   **Parameters:**
    | Field | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `id` | String | Yes | MongoDB ID of the document. |
