import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path (in the root directory)
const dbPath = path.join(__dirname, '..', 'library_warehouse.db');

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function initDb() {
  console.log('Initializing database...');
  
  // Operational Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS op_staff (
      staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS op_books (
      isbn TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL,
      format TEXT DEFAULT 'Hardcover'
    );

    CREATE TABLE IF NOT EXISTS op_students (
      student_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      faculty TEXT NOT NULL,
      course TEXT NOT NULL,
      year INTEGER,
      region TEXT DEFAULT 'Central'
    );

    CREATE TABLE IF NOT EXISTS op_loans (
      loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT NOT NULL,
      student_id TEXT NOT NULL,
      borrow_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      fine_amount REAL,
      FOREIGN KEY (isbn) REFERENCES op_books(isbn),
      FOREIGN KEY (student_id) REFERENCES op_students(student_id)
    );
  `);

  // Warehouse Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS dim_books (
      isbn TEXT PRIMARY KEY,
      title TEXT,
      author TEXT,
      category TEXT,
      format TEXT
    );

    CREATE TABLE IF NOT EXISTS dim_students (
      student_id TEXT PRIMARY KEY,
      name TEXT,
      faculty TEXT,
      course TEXT,
      year INTEGER,
      region TEXT
    );

    CREATE TABLE IF NOT EXISTS dim_time (
      time_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      day INTEGER,
      month TEXT,
      month_val INTEGER,
      year INTEGER,
      day_of_week TEXT,
      quarter TEXT
    );

    CREATE TABLE IF NOT EXISTS fact_loans (
      fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_isbn TEXT,
      student_id TEXT,
      time_id INTEGER,
      loan_duration INTEGER,
      is_overdue INTEGER, -- Boolean stored as 0/1
      fine_amount REAL,
      FOREIGN KEY (book_isbn) REFERENCES dim_books(isbn),
      FOREIGN KEY (student_id) REFERENCES dim_students(student_id),
      FOREIGN KEY (time_id) REFERENCES dim_time(time_id)
    );

    -- Warehouse Indexes for Performance
    CREATE INDEX IF NOT EXISTS idx_fact_loans_book ON fact_loans(book_isbn);
    CREATE INDEX IF NOT EXISTS idx_fact_loans_student ON fact_loans(student_id);
    CREATE INDEX IF NOT EXISTS idx_fact_loans_time ON fact_loans(time_id);
    
    CREATE INDEX IF NOT EXISTS idx_dim_time_year_month ON dim_time(year, month_val);
    CREATE INDEX IF NOT EXISTS idx_dim_students_faculty ON dim_students(faculty);
    CREATE INDEX IF NOT EXISTS idx_dim_books_category ON dim_books(category);

    -- System Tables
    CREATE TABLE IF NOT EXISTS sys_etl_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT CHECK(status IN ('RUNNING', 'SUCCESS', 'FAILED')) NOT NULL,
      message TEXT,
      records_processed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sys_auth_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      success INTEGER NOT NULL, -- 0 or 1
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS sys_budget (
      year INTEGER PRIMARY KEY,
      total_budget REAL,
      spent_budget REAL
    );
  `);
  
  // Migrations for existing tables
  try {
    db.prepare("ALTER TABLE op_books ADD COLUMN format TEXT DEFAULT 'Hardcover'").run();
  } catch (e) { /* Column likely exists */ }
  
  try {
    db.prepare("ALTER TABLE op_students ADD COLUMN region TEXT DEFAULT 'Central'").run();
  } catch (e) { /* Column likely exists */ }

  try {
    db.prepare("ALTER TABLE dim_books ADD COLUMN format TEXT").run();
  } catch (e) { /* Column likely exists */ }
  
  try {
    db.prepare("ALTER TABLE dim_students ADD COLUMN region TEXT").run();
  } catch (e) { /* Column likely exists */ }
  
  console.log('Database initialized.');
}
