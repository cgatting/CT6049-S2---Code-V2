# Assessment Ticksheet - CT6049 Assignment 002

## Core Requirements

| Requirement | Status | Implementation Details |
|-------------|--------|------------------------|
| **Operational Database** | ✅ | Implemented using SQLite (`operational.db`). Entities: `OpBook`, `OpStudent`, `OpLoan`, `OpStaff`. Seeded with random sample data on startup. |
| **Warehouse Database** | ✅ | Implemented using SQLite (`library_warehouse.db`). Dimensional Model: `DimBook`, `DimStudent`, `DimTime`, `FactLoan`. |
| **Dimensional Model** | ✅ | Star Schema implemented. Fact table `FactLoan` links to Dimensions. |
| **ETL Process** | ✅ | `ETLService.java` implements extraction from Operational Repositories, transformation (lookup/creation of dimensions), and loading into Fact table. |
| **Secure Authentication** | ✅ | Spring Security with JWT (JSON Web Tokens). `AuthController` handles login. `JwtAuthenticationFilter` secures API endpoints. Passwords hashed using BCrypt. |
| **User Roles** | ✅ | Supported Roles: Vice-chancellor, Dept Head, Finance Director, Chief Librarian, Admission Director. |
| **Interactive Reports** | ✅ | React Frontend provides Dashboard and Reports pages. Charts (Bar, Line, Area, Pie) using `recharts`. Filtering by Time (1m, 3m, 6m) and Dimensions (Faculty, etc.). |
| **Decision Maker Questions** | ✅ | The dashboard answers key questions like "Borrowing trends by Faculty", "Financial Fines Overview", "Student Activity", "Budget/Revenue Streams". |
| **Java Code** | ✅ | Backend implemented in Java 17 with Spring Boot 3.2. |
| **Build Scripts** | ✅ | Maven `pom.xml` provided. `DataSeeder` handles database schema creation and data population automatically. |

## Advanced Requirements

| Requirement | Status | Implementation Details |
|-------------|--------|------------------------|
| **Indexes** | ✅ | Primary Keys and Foreign Keys are indexed by default in JPA/SQLite. `findByIsbn` and `findByUsername` queries leverage these. |
| **Prepared Statements** | ✅ | Spring Data JPA / Hibernate uses Prepared Statements by default for all repository methods, preventing SQL Injection. |
| **Security Analysis** | ✅ | Stateless JWT authentication implemented. CORS configured for Frontend. Password hashing (BCrypt) used. |

## Testing

| Test Type | Status | Details |
|-----------|--------|---------|
| **Unit Tests** | ✅ | Comprehensive unit tests for Controllers and Services implemented using JUnit 5 and Mockito. |
| **Integration Tests** | ✅ | `DashboardControllerTests` and `ETLServiceTests` verify end-to-end flow and ETL logic. |
| **Load Testing** | ✅ | `LoadTests.java` simulates 100 concurrent requests to verify stability. |

## Deployment

1. **Backend**: Run `mvn spring-boot:run` in `backend/`.
2. **Frontend**: Run `npm run dev` in root.
3. **Credentials**:
   - Vice Chancellor: `vc` / `password`
   - Dept Head: `dh` / `password`
   - Finance: `fd` / `password`
   - Librarian: `cl` / `password`
