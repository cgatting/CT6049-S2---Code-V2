import bcrypt from 'bcryptjs';
import { db } from './db.js';

export function seedData() {
  const staffCount = db.prepare('SELECT count(*) as count FROM op_staff').get() as { count: number };
  
  if (staffCount.count === 0) {
    console.log('Seeding Staff...');
    const insertStaff = db.prepare('INSERT INTO op_staff (username, password, full_name, role) VALUES (?, ?, ?, ?)');
    
    const staff = [
      ['vc', 'password', 'Dr. Sarah Smith', 'Vice-chancellor'],
      ['dh', 'password', 'Prof. Alan Grant', 'Departmental Head'],
      ['fd', 'password', 'Emily Chen', 'Finance Director'],
      ['cl', 'password', 'Marcus Johnson', 'Chief Librarian'],
      ['ad', 'password', 'Admission Director', 'Admission Director']
    ];

    for (const [username, rawPwd, name, role] of staff) {
      const hash = bcrypt.hashSync(rawPwd, 10);
      insertStaff.run(username, hash, name, role);
    }
  }

  const bookCount = db.prepare('SELECT count(*) as count FROM op_books').get() as { count: number };
  if (bookCount.count < 50) {
    console.log('Seeding Books...');
    const insertBook = db.prepare('INSERT INTO op_books (isbn, title, author, category, price, format) VALUES (?, ?, ?, ?, ?, ?)');
    const categories = ['Science', 'Engineering', 'Arts', 'Business', 'Medicine', 'Law', 'Technology', 'History'];
    const authors = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const formats = ['Hardcover', 'Paperback', 'E-Book', 'Audiobook'];
    
    for (let i = 0; i < 100; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const author = authors[Math.floor(Math.random() * authors.length)];
      const format = formats[Math.floor(Math.random() * formats.length)];
      const isbn = `978-${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
      insertBook.run(isbn, `${category} Volume ${i + 1}`, author, category, 40 + Math.random() * 100, format);
    }
  } else {
    // Backfill formats for existing books if they are all Hardcover (default)
    const checkFormats = db.prepare("SELECT count(*) as count FROM op_books WHERE format = 'Hardcover'").get() as { count: number };
    if (checkFormats.count > 0) {
       console.log('Randomizing book formats...');
       const formats = ['Hardcover', 'Paperback', 'E-Book', 'Audiobook'];
       const books = db.prepare("SELECT isbn FROM op_books").all() as {isbn: string}[];
       const updateFormat = db.prepare("UPDATE op_books SET format = ? WHERE isbn = ?");
       const transaction = db.transaction(() => {
         for(const book of books) {
           const format = formats[Math.floor(Math.random() * formats.length)];
           updateFormat.run(format, book.isbn);
         }
       });
       transaction();
    }
  }

  const studentCount = db.prepare('SELECT count(*) as count FROM op_students').get() as { count: number };
  if (studentCount.count < 100) {
    console.log('Seeding Students...');
    const insertStudent = db.prepare('INSERT INTO op_students (student_id, name, faculty, course, year, region) VALUES (?, ?, ?, ?, ?, ?)');
    const faculties = ['Science', 'Engineering', 'Arts', 'Business', 'Medicine', 'Law'];
    const names = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
    const surnames = ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Thomas', 'Roberts'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];

    for (let i = 0; i < 500; i++) {
      const faculty = faculties[Math.floor(Math.random() * faculties.length)];
      const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
      const region = regions[Math.floor(Math.random() * regions.length)];
      const studentId = `S${(i + 1).toString().padStart(4, '0')}`;
      insertStudent.run(studentId, name, faculty, `${faculty} Studies`, Math.floor(Math.random() * 4) + 1, region);
    }
  } else {
    // Backfill regions for existing students if they are all Central (default)
    const checkRegions = db.prepare("SELECT count(*) as count FROM op_students WHERE region = 'Central'").get() as { count: number };
    if (checkRegions.count > 0) {
       console.log('Randomizing student regions...');
       const regions = ['North', 'South', 'East', 'West', 'Central'];
       const students = db.prepare("SELECT student_id FROM op_students").all() as {student_id: string}[];
       const updateRegion = db.prepare("UPDATE op_students SET region = ? WHERE student_id = ?");
       const transaction = db.transaction(() => {
         for(const student of students) {
           const region = regions[Math.floor(Math.random() * regions.length)];
           updateRegion.run(region, student.student_id);
         }
       });
       transaction();
    }
  }

  const loanCount = db.prepare('SELECT count(*) as count FROM op_loans').get() as { count: number };
  if (loanCount.count < 10000) {
    console.log('Seeding 10,000 Loans...');
    const books = db.prepare('SELECT isbn FROM op_books').all() as { isbn: string }[];
    const students = db.prepare('SELECT student_id FROM op_students').all() as { student_id: string }[];
    const insertLoan = db.prepare('INSERT INTO op_loans (isbn, student_id, borrow_date, due_date, return_date, fine_amount) VALUES (?, ?, ?, ?, ?, ?)');

    const targetCount = 10000;
    const currentCount = loanCount.count;
    const needed = targetCount - currentCount;

    // Use a transaction for much faster inserts
    const insertMany = db.transaction((loans) => {
      for (const loan of loans) {
        insertLoan.run(...loan);
      }
    });

    const newLoans = [];
    for (let i = 0; i < needed; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const student = students[Math.floor(Math.random() * students.length)];
      
      // Last 5 years
      const daysAgo = Math.floor(Math.random() * (365 * 5));
      const borrowDate = new Date();
      borrowDate.setDate(borrowDate.getDate() - daysAgo);
      
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + 14);

      let returnDate: string | null = null;
      let fineAmount = 0.0;

      // 70% chance of return
      if (Math.random() > 0.3) {
        const daysLate = Math.floor(Math.random() * 30) - 10; // -10 to 20
        const rDate = new Date(dueDate);
        rDate.setDate(rDate.getDate() + daysLate);
        
        // Don't allow return date in the future relative to "now"
        if (rDate <= new Date()) {
            returnDate = rDate.toISOString().split('T')[0];
            if (daysLate > 0) {
              fineAmount = daysLate * 0.50;
            }
        }
      }

      newLoans.push([
        book.isbn,
        student.student_id,
        borrowDate.toISOString().split('T')[0],
        dueDate.toISOString().split('T')[0],
        returnDate,
        fineAmount
      ]);

      if (newLoans.length >= 1000) {
        insertMany(newLoans);
        newLoans.length = 0;
      }
    }
    if (newLoans.length > 0) {
      insertMany(newLoans);
    }
  }
  
  // Seed Budget Data
  const budgetCount = db.prepare('SELECT count(*) as count FROM sys_budget').get() as { count: number };
  if (budgetCount.count === 0) {
    console.log('Seeding Budget...');
    db.prepare('INSERT INTO sys_budget (year, total_budget, spent_budget) VALUES (?, ?, ?)').run(2024, 500000, 420000);
  }

  console.log('Seeding completed.');
}
