# CT6049 Assignment 2 - Implementation Report Draft

**Student ID:** [Your Student ID]
**Module:** CT6049 Data Warehousing and Data Mining

---

## 1. Critical Evaluation of Database Warehouse Dimensional Model

For this Library Data Warehouse, a **Star Schema** was selected as the dimensional modelling technique. This design optimizes query performance for decision-support systems by simplifying the database structure into a central **Fact Table** surrounded by **Dimension Tables**.

### 1.1 Model Structure
*   **Fact Table (`fact_loans`)**: This table captures the core business process—the borrowing of a book. It contains foreign keys to dimensions and quantitative measures:
    *   `loan_duration` (Derived measure: Days book was kept)
    *   `is_overdue` (Boolean measure: 1 for overdue, 0 for on-time)
    *   `fine_amount` (Monetary measure)
*   **Dimensions**:
    *   **`dim_books`**: Stores book attributes (Title, Author, Category) to allow slicing data by genre or subject.
    *   **`dim_students`**: Stores borrower attributes (Faculty, Course, Year) to enable analysis of student engagement by department.
    *   **`dim_time`**: A dedicated time dimension supporting hierarchical aggregation (Day -> Month -> Quarter -> Year). This is crucial for trend analysis (e.g., "Monthly Borrowing Trends").

### 1.2 Justification
The Star Schema was chosen over a Snowflake Schema because normalization of dimensions (e.g., splitting Faculty into its own table) was deemed unnecessary for the scale of this library system. The Star Schema offers:
1.  **Simpler Queries**: Fewer joins are required compared to Snowflake or 3NF, making reports easier to write and faster to execute.
2.  **Aggregation Performance**: The denormalized dimensions (e.g., storing `Quarter` directly in `dim_time`) allow for rapid GROUP BY operations, essential for the Vice-Chancellor's dashboard.

---

## 2. Explanation of Database Warehouse ETL Process

The ETL (Extract, Transform, Load) process is implemented in TypeScript (`server/etl.ts`) and bridges the gap between the transactional `op_` tables and the analytical `dim_`/`fact_` tables.

### 2.1 Extract & Transform
The process iterates through the operational data. A key transformation occurs in the handling of **Time**. The operational database stores dates as simple strings (e.g., "2023-09-01"). The ETL process expands this into a rich `dim_time` entry:

```typescript
// Code Snippet from server/etl.ts
const date = new Date(dateStr);
const dayOfWeek = date.toLocaleString('default', { weekday: 'long' }); // e.g., "Monday"
const quarter = `Q${Math.floor((date.getMonth() + 3) / 3)}`; // e.g., "Q3"
// This allows questions like "Which day of the week is busiest?" to be answered efficiently.
```

### 2.2 Load
Data is loaded into the `fact_loans` table. During this phase, business logic is applied to calculate derived measures that don't exist in the operational DB, such as `loan_duration`.

```typescript
// Code Snippet: Calculating Derived Measures
const diffTime = Math.abs(returnDate.getTime() - borrowDate.getTime());
loanDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
```

The process uses transactions (`db.transaction`) to ensure data integrity—if any part of the load fails, the entire batch is rolled back.

---

## 3. Critical Analysis of Security and Implementation

### 3.1 Authentication & User Accounts
Security is implemented using **JWT (JSON Web Tokens)**. When a user logs in via `/auth/login`, the server validates their credentials against `op_staff` (where passwords are hashed using `bcryptjs`) and issues a signed token.

*   **Statelessness**: The JWT approach allows the server to be stateless, scaling easily.
*   **Role-Based Access Control (RBAC)**: The token contains the user's `role`. Middleware (`requireRole`) protects sensitive endpoints.

```typescript
// Code Snippet: RBAC Middleware
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.sendStatus(403); // Forbidden
    }
    next();
  };
};
```
*   **Example**: The `Finance Director` can access `/reports/fines-overview`, but a `Department Head` cannot, ensuring financial privacy.

### 3.2 Indexes
Indexes were explicitly created in the warehouse to speed up specific report queries:
*   `idx_fact_loans_student` -> Speeds up "Top Borrowers" query.
*   `idx_dim_time_year_month` -> Essential for the "Monthly Trends" chart which filters by range.

### 3.3 Prepared Statements
The application strictly uses **Prepared Statements** (via `better-sqlite3`) for all database interactions. This serves two critical purposes:
1.  **Security**: It completely prevents **SQL Injection** attacks by separating SQL code from data.
2.  **Performance**: The database engine compiles the SQL plan once and reuses it, which is efficient for repetitive insert operations during ETL.

```typescript
// Code Snippet: Prepared Statement
const insertFact = db.prepare(`
  INSERT INTO fact_loans (book_isbn, student_id, time_id, ...)
  VALUES (?, ?, ?, ...)
`);
// This pattern is used throughout server/routes.ts and server/etl.ts
```

---

## 4. Backup, Restore, and Recovery

### 4.1 Backup Strategy
Given the database is SQLite (`library_warehouse.db`), the backup strategy is file-based but must ensure consistency.
*   **Hot Backup**: Use the SQLite Online Backup API (or `sqlite3 .backup` command) which copies the database while it is being used, leveraging the WAL (Write-Ahead Log) mode enabled in the application.
*   **Schedule**: A cron job running nightly: `sqlite3 library_warehouse.db ".backup 'backups/backup_$(date +%F).db'"`

### 4.2 Recovery
Recovery is a simple file restoration:
1.  Stop the Node.js server.
2.  Copy the backup file to `library_warehouse.db`.
3.  Restart the server.

---

## 5. Load Testing Plan

To ensure the system handles concurrent access by all university decision makers:

*   **Tool**: **Apache JMeter** or **k6**.
*   **Scenario**:
    1.  Simulate 50 concurrent users (VC, Heads, Librarians).
    2.  Each user logs in (POST `/auth/login`) to get a token.
    3.  Users repeatedly access the heavy dashboard endpoint (`GET /reports/monthly-trends`) and (`GET /reports/loans-by-faculty`).
*   **Success Criteria**:
    *   95% of requests complete in < 200ms.
    *   0% Error rate.
    *   CPU usage on server < 70%.

---

## Appendix: Decision Maker Questions Answered

1.  What is the borrowing volume per Faculty? (`/reports/loans-by-faculty`)
2.  How is borrowing trending over the last 6 months? (`/reports/monthly-trends`)
3.  What is the total value of collected vs outstanding fines? (`/reports/fines-overview`)
4.  What are the most popular book categories? (`/reports/popular-categories`)
5.  Which faculties have the highest overdue rates? (`/reports/overdue-stats`)
6.  Who are the top student borrowers? (`/reports/top-borrowers`)
7.  Which days of the week are busiest? (`/reports/peak-days`)
8.  What is the average loan duration by faculty? (`/reports/avg-duration`)
9.  Which books are "Dead Stock" (never borrowed)? (`/reports/dead-stock`)
10. What are the key KPIs (Active loans, Total Patrons)? (`/dashboard/kpi`)
