# CT6049 Assignment 2 - Implementation Map

This document outlines how the software meets the assessment requirements defined in `CT6049_Assignment_002_Assessment_Brief.pdf`.

## 1. Data Warehouse & ETL

*   **Operational Database**: Implemented in `server/db.ts` (Tables: `op_staff`, `op_books`, `op_students`, `op_loans`).
*   **Warehouse Database**: Implemented in `server/db.ts` (Tables: `dim_books`, `dim_students`, `dim_time`, `fact_loans`).
*   **Dimensional Model**: Star Schema used. 
    *   **Fact**: `fact_loans` (Measures: `loan_duration`, `is_overdue`, `fine_amount`).
    *   **Dimensions**: Book, Student, Time.
*   **ETL Process**: Implemented in `server/etl.ts`.
    *   Extracts from `op_` tables.
    *   Transforms dates into `dim_time` (Day, Month, Quarter, Year).
    *   Loads into `fact_loans`.
    *   **Automation**: Runs on server startup in `server/index.ts`.

## 2. Decision Maker Questions (Reports)

The application answers the required decision maker queries via specific API endpoints in `server/routes.ts`:

1.  **Faculty Borrowing Volumes**: `/api/reports/loans-by-faculty`
2.  **Monthly/Quarterly Trends (1m, 3m, 6m)**: `/api/reports/monthly-trends`
3.  **Financial Overview (Fines)**: `/api/reports/fines-overview`
4.  **Popular Book Categories**: `/api/reports/popular-categories`
5.  **Overdue Rates by Faculty**: `/api/reports/overdue-stats`
6.  **Top Borrowers**: `/api/reports/top-borrowers`
7.  **Peak Borrowing Days**: `/api/reports/peak-days`
8.  **KPIs (Active Loans, Overdue, Patrons)**: `/api/dashboard/kpi`

## 3. Security & Access Control

*   **Authentication**: JWT-based auth implemented in `server/routes.ts` (`/auth/login`).
*   **Middleware**: `server/middleware.ts` handles `authenticateToken` and `requireRole`.
*   **Role-Based Access Control (RBAC)**:
    *   **Vice-Chancellor**: Full access to all strategic reports.
    *   **Finance Director**: Exclusive access to financial reports (`/reports/fines-overview`).
    *   **Department Heads**: Faculty-specific views.
*   **Encryption**: Passwords hashed using `bcryptjs`.

## 4. Performance

*   **Indexes**: Added in `server/db.ts` (`idx_fact_loans_book`, `idx_dim_time_year_month`, etc.) to optimize warehouse aggregations.
*   **Prepared Statements**: Used exclusively via `better-sqlite3` throughout `server/routes.ts` and `server/etl.ts` to prevent SQL injection and improve query performance.

## 5. Deployment

*   **Startup**: Use `launcher.bat` to verify prerequisites, install dependencies, and start the full stack (Frontend + Backend).
