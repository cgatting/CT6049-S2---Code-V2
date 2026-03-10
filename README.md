# CT6049 Assignment 2: Library Data Warehouse

This project implements a Library Data Warehouse system as required for the CT6049 assessment. It includes an Operational Database, a Data Warehouse (Star Schema), an ETL process, and a React-based Analytics Dashboard.

## Features

*   **Operational Database**: SQLite database simulating a library management system.
*   **Data Warehouse**: Star Schema implementation (`fact_loans`, `dim_books`, `dim_students`, `dim_time`).
*   **ETL Process**: Automated script to extract, transform, and load data.
*   **Analytics Dashboard**: Secure, role-based reporting system answering key decision-maker questions.
*   **Security**: JWT Authentication and Role-Based Access Control (RBAC).

## Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Application**:
    ```bash
    npm run dev
    ```
    This command starts both the Backend API (Port 3001) and Frontend (Port 5173/3000).

3.  **Access**:
    Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

## Login Credentials (Sample Data)

*   **Vice-Chancellor**: `vc` / `password`
*   **Department Head**: `dh` / `password`
*   **Finance Director**: `fd` / `password`
*   **Chief Librarian**: `cl` / `password`
*   **Admission Director**: `ad` / `password`

## Assessment Deliverables

*   **Source Code**: Contained in this repository.
*   **Report**: A draft for the required written report can be found in `REPORT_DRAFT.md`.