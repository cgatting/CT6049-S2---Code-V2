import { db } from './db.js';

export function runETL() {
  console.log('Running ETL Process...');
  const startTime = new Date().toISOString();
  
  // Start Log
  const result = db.prepare('INSERT INTO sys_etl_logs (start_time, status, message) VALUES (?, ?, ?)').run(startTime, 'RUNNING', 'ETL Started');
  const logId = result.lastInsertRowid;

  try {
    let records = 0;
    
    const transaction = db.transaction(() => {
      loadDimBooks();
      loadDimStudents();
      records = loadFactLoans();
    });

    transaction();
    
    const endTime = new Date().toISOString();
    db.prepare('UPDATE sys_etl_logs SET end_time = ?, status = ?, message = ?, records_processed = ? WHERE log_id = ?')
      .run(endTime, 'SUCCESS', 'Completed successfully', records, logId);
      
    console.log(`ETL Process Completed. Processed ${records} facts.`);
  } catch (error: any) {
    const endTime = new Date().toISOString();
    db.prepare('UPDATE sys_etl_logs SET end_time = ?, status = ?, message = ? WHERE log_id = ?')
      .run(endTime, 'FAILED', error.message || 'Unknown Error', logId);
    console.error('ETL Failed:', error);
    throw error;
  }
}

function loadDimBooks() {
  const opBooks = db.prepare('SELECT * FROM op_books').all() as any[];
  const insertDim = db.prepare('INSERT OR REPLACE INTO dim_books (isbn, title, author, category, format) VALUES (?, ?, ?, ?, ?)');

  for (const book of opBooks) {
    insertDim.run(book.isbn, book.title, book.author, book.category, book.format);
  }
}

function loadDimStudents() {
  const opStudents = db.prepare('SELECT * FROM op_students').all() as any[];
  const insertDim = db.prepare('INSERT OR REPLACE INTO dim_students (student_id, name, faculty, course, year, region) VALUES (?, ?, ?, ?, ?, ?)');

  for (const student of opStudents) {
    insertDim.run(student.student_id, student.name, student.faculty, student.course, student.year, student.region);
  }
}

function loadFactLoans(): number {
  const opLoans = db.prepare('SELECT * FROM op_loans').all() as any[];
  const insertFact = db.prepare(`
    INSERT INTO fact_loans (book_isbn, student_id, time_id, loan_duration, is_overdue, fine_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Check if fact exists to avoid duplicates (Simple check based on business key combo if needed, 
  // but since we don't have a unique loan_id in fact, we might duplicate on re-run without truncation.
  // Real approach: Truncate facts OR use incremental load with a watermark.
  // For this assignment: We will TRUNCATE facts to ensure clean slate on every run.)
  
  db.prepare('DELETE FROM fact_loans').run();

  let count = 0;
  for (const loan of opLoans) {
    const timeId = getOrCreateTime(loan.borrow_date);
    
    let loanDuration = null;
    let isOverdue = 0;
    
    const borrowDate = new Date(loan.borrow_date);
    const dueDate = new Date(loan.due_date);
    const now = new Date();

    if (loan.return_date) {
      const returnDate = new Date(loan.return_date);
      const diffTime = Math.abs(returnDate.getTime() - borrowDate.getTime());
      loanDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      isOverdue = returnDate > dueDate ? 1 : 0;
    } else {
      isOverdue = now > dueDate ? 1 : 0;
    }

    insertFact.run(
      loan.isbn,
      loan.student_id,
      timeId,
      loanDuration,
      isOverdue,
      loan.fine_amount
    );
    count++;
  }
  return count;
}

function getOrCreateTime(dateStr: string): number {
  const checkTime = db.prepare('SELECT time_id FROM dim_time WHERE date = ?');
  const existing = checkTime.get(dateStr) as { time_id: number } | undefined;
  
  if (existing) return existing.time_id;

  const date = new Date(dateStr);
  const day = date.getDate();
  const monthVal = date.getMonth() + 1;
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  const dayOfWeek = date.toLocaleString('default', { weekday: 'long' });
  const quarter = `Q${Math.floor((date.getMonth() + 3) / 3)}`;

  const insertTime = db.prepare(`
    INSERT INTO dim_time (date, day, month, month_val, year, day_of_week, quarter)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertTime.run(dateStr, day, month, monthVal, year, dayOfWeek, quarter);
  return result.lastInsertRowid as number;
}
