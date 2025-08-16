# Personal Cloud: AI-Powered File Storage & Search

<!-- <div align="center">
  <img src="https://via.placeholder.com/150/FF7A00/FFFFFF?text=PC" alt="Personal Cloud Logo" width="150"/>
</div> -->

<h3 align="center">
  A modern, full-stack web application for secure and intelligent file storage, featuring AI-powered semantic search.
</h3>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Badge"/>
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js Badge"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS Badge"/>
</p>

## ✨ Key Features

* **🔐 Secure User Authentication:** JWT-based authentication with role-based access control (user and root roles).
* **📂 File Upload & Management:** Drag-and-drop file uploads, versioning, download, and deletion functionalities.
* **🧠 AI-Powered Search:** Ask natural language questions about your PDF documents and get intelligent answers powered by Large Language Models (LLMs) and vector embeddings.
* **📊 Dashboard Analytics:** An intuitive dashboard providing statistics on total files, storage usage, active users, and AI processing status.
* **👥 User Management (Admin):** Root users can create, manage, and delete user accounts with temporary access.
* **📱 Responsive UI:** A sleek and modern user interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

**Frontend:**

* **React:** A JavaScript library for building user interfaces.
* **React Router:** For declarative routing in React.
* **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
* **Axios:** A promise-based HTTP client for the browser and Node.js.
* **Chart.js:** For creating beautiful and responsive charts.

**Backend:**

* **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
* **Express.js:** A minimal and flexible Node.js web application framework.
* **MongoDB:** A NoSQL database for storing application data.
* **Mongoose:** An elegant MongoDB object modeling tool for Node.js.
* **JWT (JSON Web Tokens):** For secure user authentication.
* **LangChain & Hugging Face Transformers:** For creating vector embeddings from PDF documents.
* **Groq SDK:** For interacting with the Groq API for fast AI inference.
* **Multer:** A Node.js middleware for handling `multipart/form-data`.

## 🚀 Getting Started

### Prerequisites

* Node.js (v14 or later)
* npm
* MongoDB Atlas account or a local MongoDB instance.
* Groq API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NaruSudarshan/personal-cloud.git
    cd personal-cloud
    ```

2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install frontend dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

### Configuration

1.  **Create a `.env` file in the `backend` directory and add the following:**
    ```env
    PORT=5000
    MONGODB_URI=<your_mongodb_uri>
    DB_NAME=<your_database_name>
    UPLOAD_DIR=<path_to_upload_directory>
    JWT_SECRET=<your_jwt_secret>
    GROQ_API_KEY=<your_groq_api_key>
    ```

2.  **Create a root user in your MongoDB database.**

## 🏃‍♂️ Usage

1.  **Start the backend server:**
    ```bash
    cd backend
    node index.js
    ```

2.  **Start the frontend development server:**
    ```bash
    cd frontend
    npm run dev
    ```

The application will be available at `http://localhost:5173/`.

## 🛣️ Roadmap

* [ ] **Cloud Storage Integration:** Integrate with cloud storage providers like AWS S3 for scalable and robust file storage.
* [ ] **Expanded File Type Support:** Add support for more file types (e.g., DOCX, TXT) for AI-powered search.
* [ ] **Folder Management:** Implement a folder system for better organization of files.
* [ ] **Advanced Sharing & Collaboration:** Introduce features for sharing files and collaborating with other users.
* [ ] **Detailed Analytics:** Provide more in-depth analytics and reporting on file usage and user activity.

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.