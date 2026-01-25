# Student Portal API Routes

This document outlines the API endpoints required for the Vue.js student portal frontend. The backend for these routes will be implemented in the existing Node.js/Express application.

## Authentication

### `POST /api/student/login`

Authenticates a student and returns a JWT token.

-   **Request Body:**
    ```json
    {
        "email": "student@example.com",
        "password": "password123"
    }
    ```
-   **Success Response (200):**
    ```json
    {
        "token": "your_jwt_token",
        "message": "Login successful"
    }
    ```
-   **Error Response (401):**
    ```json
    {
        "message": "Invalid credentials"
    }
    ```

### `POST /api/student/logout`

Logs out the student by invalidating the token (implementation can be server-side blocklist).

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):**
    ```json
    {
        "message": "Logged out successfully"
    }
    ```

### `GET /api/student/me`

Retrieves the profile of the currently authenticated student.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):**
    ```json
    {
        "student_id": 101,
        "email": "student@example.com",
        "name": "John Doe",
        "class": "10TH",
        "session": "2025-2026"
    }
    ```

## Profile & Academics

### `GET /api/student/profile`

Get the student's full profile details.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):** Returns a JSON object with all fields from the `students` table and a base64 encoded profile photo from the `photo` table.

### `GET /api/student/result`

Get the student's complete academic report card by calling the `get_student_full_result` stored procedure.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):** Returns a JSON object containing:
    -   Student Details
    -   Marks per subject per term (including max marks)
    -   Term-wise performance (total, percentage)
    -   Term-wise grades and remarks
    -   Attendance and promotion status
    -   School Info

## Files & Documents

### `GET /api/student/files`

Get a list of all files and documents associated with the student.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):**
    ```json
    [
        {
            "id": 1,
            "file_name": "transfer-certificate.pdf",
            "type": "PDF",
            "upload_date": "2026-01-15"
        }
    ]
    ```

### `GET /api/student/files/:file_id`

Download a specific file by its ID.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):** Returns the file stream.

## Settings & Notifications

### `GET /api/student/settings`

Retrieve the student's current settings.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):** Returns a JSON object from `student_settings` table.

### `PUT /api/student/settings`

Update the student's settings.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Request Body:**
    ```json
    {
        "theme": "dark",
        "notifications_enabled": false
    }
    ```
-   **Success Response (200):** Returns the updated settings object.

### `GET /api/student/notifications`

Get a list of notifications for the student.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):** Returns an array of notification objects.

### `PUT /api/student/notifications/:notification_id/read`

Mark a specific notification as read.

-   **Headers:** `Authorization: Bearer your_jwt_token`
-   **Success Response (200):**
    ```json
    {
        "message": "Notification marked as read"
    }
    ```
