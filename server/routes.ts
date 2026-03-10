import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { runETL } from './etl.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437';

// --- Auth Routes ---
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress;
  
  const user = db.prepare('SELECT * FROM op_staff WHERE username = ?').get(username) as any;
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    db.prepare('INSERT INTO sys_auth_logs (username, timestamp, success, ip_address) VALUES (?, ?, 0, ?)').run(username, new Date().toISOString(), ip);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  db.prepare('INSERT INTO sys_auth_logs (username, timestamp, success, ip_address) VALUES (?, ?, 1, ?)').run(username, new Date().toISOString(), ip);

  // Token valid for 24h
  const token = jwt.sign({ id: user.staff_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    token,
    id: user.staff_id.toString(),
    name: user.full_name,
    role: user.role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}`
  });
});

// Public demo accounts listing (for login page)
router.get('/auth/demo-accounts', (req, res) => {
  const accounts = db.prepare('SELECT username, role, full_name FROM op_staff ORDER BY role').all();
  res.json({
    disclaimer: 'Demo accounts for evaluation only. Do not use in production.',
    default_password: 'password',
    accounts
  });
});

router.get('/app/overview', authenticateToken, (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();

  const countValue = (query: string, ...params: any[]) => {
    const row = db.prepare(query).get(...params) as { value?: number; count?: number } | undefined;
    return row?.value ?? row?.count ?? 0;
  };

  const currentBudget = db.prepare(`
    SELECT year, total_budget, spent_budget
    FROM sys_budget
    ORDER BY year DESC
    LIMIT 1
  `).get() as { year: number; total_budget: number; spent_budget: number } | undefined;

  const lastEtl = db.prepare(`
    SELECT log_id, start_time, end_time, status, records_processed
    FROM sys_etl_logs
    ORDER BY start_time DESC
    LIMIT 1
  `).get() as {
    log_id: number;
    start_time: string;
    end_time: string | null;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    records_processed: number;
  } | undefined;

  res.json({
    refreshedAt: now.toISOString(),
    role: (req as any).user?.role,
    brief: {
      decisionQuestions: 10,
      interactiveReports: 12,
      securedAccounts: countValue('SELECT COUNT(*) as value FROM op_staff'),
    },
    operational: {
      books: countValue('SELECT COUNT(*) as value FROM op_books'),
      students: countValue('SELECT COUNT(*) as value FROM op_students'),
      loans: countValue('SELECT COUNT(*) as value FROM op_loans'),
      staff: countValue('SELECT COUNT(*) as value FROM op_staff'),
    },
    warehouse: {
      books: countValue('SELECT COUNT(*) as value FROM dim_books'),
      students: countValue('SELECT COUNT(*) as value FROM dim_students'),
      facts: countValue('SELECT COUNT(*) as value FROM fact_loans'),
      timeKeys: countValue('SELECT COUNT(*) as value FROM dim_time'),
      indexes: countValue("SELECT COUNT(*) as value FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'"),
      etlRuns: countValue('SELECT COUNT(*) as value FROM sys_etl_logs'),
      lastEtl,
    },
    circulation: {
      activeLoans: countValue('SELECT COUNT(*) as value FROM fact_loans WHERE loan_duration IS NULL'),
      overdueItems: countValue('SELECT COUNT(*) as value FROM fact_loans WHERE is_overdue = 1'),
      deadStock: countValue(`
        SELECT COUNT(*) as value
        FROM dim_books b
        LEFT JOIN fact_loans f ON b.isbn = f.book_isbn
        WHERE f.fact_id IS NULL
      `),
      fineExposure: Number((
        db.prepare(`
          SELECT SUM(fine_amount) as value
          FROM fact_loans
          WHERE fine_amount IS NOT NULL
        `).get() as { value: number | null }
      )?.value ?? 0),
    },
    governance: {
      successfulLogins24h: countValue('SELECT COUNT(*) as value FROM sys_auth_logs WHERE success = 1 AND timestamp >= ?', last24Hours),
      failedLogins24h: countValue('SELECT COUNT(*) as value FROM sys_auth_logs WHERE success = 0 AND timestamp >= ?', last24Hours),
      authEvents: countValue('SELECT COUNT(*) as value FROM sys_auth_logs'),
      currentBudget: currentBudget
        ? {
            year: currentBudget.year,
            total: currentBudget.total_budget,
            spent: currentBudget.spent_budget,
            remaining: currentBudget.total_budget - currentBudget.spent_budget,
          }
        : null,
    },
  });
});

// --- ETL Routes (Admin Only) ---
router.post('/etl/run', authenticateToken, requireRole(['Vice-chancellor', 'Chief Librarian']), (req, res) => {
  try {
    runETL();
    res.json({ message: 'ETL Process completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ETL Process failed' });
  }
});

router.get('/etl/history', authenticateToken, requireRole(['Vice-chancellor', 'Chief Librarian']), (req, res) => {
  const logs = db.prepare('SELECT * FROM sys_etl_logs ORDER BY start_time DESC LIMIT 50').all();
  res.json(logs);
});

// --- Dashboard & Report Routes ---

// 1. Faculty Loan Stats (VC, DH)
router.get('/reports/loans-by-faculty', authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      s.faculty as name,
      COUNT(f.fact_id) as borrowed,
      SUM(CASE WHEN f.loan_duration IS NOT NULL THEN 1 ELSE 0 END) as returned,
      SUM(f.is_overdue) as overdue
    FROM fact_loans f
    JOIN dim_students s ON f.student_id = s.student_id
    GROUP BY s.faculty
  `).all();
  res.json(stats);
});

// 2. Monthly Trends (Last 6 Months) (VC, FD)
router.get('/reports/monthly-trends', authenticateToken, (req, res) => {
    // Answers: "Compare number of students borrowed books... by course and faculty"
    const groupBy = req.query.groupBy === 'course' ? 'course' : 'faculty';
    const groupField = groupBy === 'course' ? 's.course' : 's.faculty';
    
    // Filters
    const category = req.query.category as string;
    const format = req.query.format as string;

    let query = `
        SELECT 
            t.month || ' ' || t.year as period,
            t.year, t.month_val,
            ${groupField} as group_name,
            count(f.fact_id) as count
        FROM fact_loans f
        JOIN dim_time t ON f.time_id = t.time_id
        JOIN dim_students s ON f.student_id = s.student_id
        JOIN dim_books b ON f.book_isbn = b.isbn
        WHERE 1=1
    `;

    const params: any[] = [];

    if (category && category !== 'All') {
        query += ` AND b.category = ?`;
        params.push(category);
    }

    if (format && format !== 'All') {
        query += ` AND b.format = ?`;
        params.push(format);
    }

    query += `
        GROUP BY t.year, t.month_val, ${groupField}
        ORDER BY t.year DESC, t.month_val DESC
        LIMIT 100
    `;

    const trends = db.prepare(query).all(...params);
    
    // Pivot data for frontend chart
    const pivoted: any[] = [];
    const map = new Map();

    trends.forEach((row: any) => {
        const key = row.period;
        if (!map.has(key)) {
            map.set(key, { month: key });
            pivoted.push(map.get(key));
        }
        map.get(key)[row.group_name] = row.count;
    });

    res.json(pivoted.reverse());
});

// 3. Fines Overview (FD)
router.get('/reports/fines-overview', authenticateToken, requireRole(['Finance Director', 'Vice-chancellor']), (req, res) => {
    const fines = db.prepare(`
        SELECT 
            'Collected' as name, SUM(fine_amount) as value FROM fact_loans WHERE loan_duration IS NOT NULL AND fine_amount > 0
        UNION ALL
        SELECT 
            'Outstanding' as name, SUM(fine_amount) as value FROM fact_loans WHERE loan_duration IS NULL AND fine_amount > 0
    `).all();
    
    // Add colors
    const result = fines.map((f: any) => ({
        ...f,
        fill: f.name === 'Collected' ? '#10b981' : '#ef4444'
    }));
    
    res.json(result);
});

// 4. Popular Categories (CL, AD)
router.get('/reports/popular-categories', authenticateToken, (req, res) => {
    const data = db.prepare(`
        SELECT b.category as name, count(*) as value
        FROM fact_loans f
        JOIN dim_books b ON f.book_isbn = b.isbn
        GROUP BY b.category
        ORDER BY value DESC
        LIMIT 5
    `).all();
    res.json(data);
});

// 5. Overdue Stats (CL, DH)
router.get('/reports/overdue-stats', authenticateToken, (req, res) => {
    const stats = db.prepare(`
        SELECT 
            s.faculty,
            SUM(f.is_overdue) as overdue_count,
            count(*) as total_loans,
            ROUND(CAST(SUM(f.is_overdue) as FLOAT) / count(*) * 100, 1) as overdue_rate
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        GROUP BY s.faculty
    `).all();
    res.json(stats);
});

// 6. Top Borrowers (AD)
router.get('/reports/top-borrowers', authenticateToken, requireRole(['Admission Director', 'Chief Librarian', 'Vice-chancellor']), (req, res) => {
    const stats = db.prepare(`
        SELECT s.name, s.course, count(*) as loans
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        GROUP BY s.student_id
        ORDER BY loans DESC
        LIMIT 10
    `).all();
    res.json(stats);
});

// 7. Peak Borrowing Days (CL)
router.get('/reports/peak-days', authenticateToken, (req, res) => {
    const stats = db.prepare(`
        SELECT t.day_of_week as day, count(*) as value
        FROM fact_loans f
        JOIN dim_time t ON f.time_id = t.time_id
        GROUP BY t.day_of_week
        ORDER BY 
          CASE t.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END
    `).all();
    res.json(stats);
});

// 8. Average Loan Duration (New - Q9)
router.get('/reports/avg-duration', authenticateToken, (req, res) => {
    const stats = db.prepare(`
        SELECT s.faculty as name, ROUND(AVG(f.loan_duration), 1) as value
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        WHERE f.loan_duration IS NOT NULL
        GROUP BY s.faculty
    `).all();
    res.json(stats);
});

// 9. Dead Stock (Books never borrowed) (New - Q10)
router.get('/reports/dead-stock', authenticateToken, (req, res) => {
    const stats = db.prepare(`
        SELECT b.title, b.category, b.author
        FROM dim_books b
        LEFT JOIN fact_loans f ON b.isbn = f.book_isbn
        WHERE f.fact_id IS NULL
        LIMIT 10
    `).all();
    res.json(stats);
});

// KPI Dashboard Endpoint
router.get('/dashboard/kpi', authenticateToken, (req, res) => {
    // Helper to get count for a specific month offset (0 = current, 1 = last month)
    const getMonthlyLoanCount = (offset: number) => {
        const date = new Date();
        date.setMonth(date.getMonth() - offset);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const result = db.prepare(`
            SELECT count(*) as val 
            FROM fact_loans f
            JOIN dim_time t ON f.time_id = t.time_id
            WHERE t.month_val = ? AND t.year = ?
        `).get(month, year) as { val: number };
        return result.val;
    };

    const currentLoans = getMonthlyLoanCount(0);
    const lastMonthLoans = getMonthlyLoanCount(1);
    const loanTrend = lastMonthLoans === 0 ? 100 : Math.round(((currentLoans - lastMonthLoans) / lastMonthLoans) * 100);

    const activeLoans = db.prepare('SELECT count(*) as val FROM fact_loans WHERE loan_duration IS NULL').get() as {val:number};
    const overdue = db.prepare('SELECT count(*) as val FROM fact_loans WHERE is_overdue = 1').get() as {val:number};
    const patrons = db.prepare('SELECT count(*) as val FROM dim_students').get() as {val:number};
    const fines = db.prepare('SELECT sum(fine_amount) as val FROM fact_loans').get() as {val:number};

    // Simple heuristic for other trends since we don't have historical snapshots of "active loans" easily available without a snapshot fact table.
    // For this assignment, we use the loan volume trend as a proxy for activity.

    res.json([
        { label: 'Monthly Loans', value: currentLoans.toLocaleString(), change: loanTrend, trend: loanTrend >= 0 ? 'up' : 'down' },
        { label: 'Active Loans', value: activeLoans.val.toLocaleString(), change: 0, trend: 'neutral' },
        { label: 'Overdue Items', value: overdue.val.toLocaleString(), change: 0, trend: 'neutral' },
        { label: 'Total Patrons', value: patrons.val.toLocaleString(), change: 0, trend: 'neutral' },
        { label: 'Fines (All Time)', value: `$${(fines.val || 0).toFixed(2)}`, change: 0, trend: 'neutral' },
    ]);
});

// 10. Student Demographics (Loans by Year) (New - For AD)
router.get('/reports/demographics', authenticateToken, (req, res) => {
    const stats = db.prepare(`
        SELECT 
            CASE s.year 
                WHEN 1 THEN 'Freshman' 
                WHEN 2 THEN 'Sophomore' 
                WHEN 3 THEN 'Junior' 
                WHEN 4 THEN 'Senior' 
                ELSE 'Post-Grad' 
            END as name,
            count(*) as value
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        GROUP BY s.year
        ORDER BY s.year
    `).all();
    res.json(stats);
});

// 11. At-Risk Students (High Overdues/Fines) (New - For DH/AD)
router.get('/reports/at-risk', authenticateToken, (req, res) => {
    const stats = db.prepare(`
        SELECT 
            s.name, 
            s.student_id,
            s.faculty,
            SUM(f.is_overdue) as overdue_count,
            SUM(f.fine_amount) as total_fines
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        GROUP BY s.student_id
        HAVING overdue_count > 0 OR total_fines > 0
        ORDER BY total_fines DESC, overdue_count DESC
        LIMIT 5
    `).all();
    res.json(stats);
});

// 12. Filter Options (New - For Reports UI)
router.get('/reports/filters', authenticateToken, (req, res) => {
    const categories = db.prepare('SELECT DISTINCT category FROM dim_books ORDER BY category').all().map((r: any) => r.category);
    const formats = db.prepare('SELECT DISTINCT format FROM dim_books ORDER BY format').all().map((r: any) => r.format);
    res.json({ categories, formats });
});

// --- Admin System Routes ---
router.get('/admin/auth-logs', authenticateToken, requireRole(['Vice-chancellor', 'Chief Librarian']), (req, res) => {
    const logs = db.prepare('SELECT * FROM sys_auth_logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json(logs);
});

// --- Specific Dashboard Routes ---

// 1. Vice-Chancellor & University Executive
router.get('/dashboard/vc/kpi', authenticateToken, requireRole(['Vice-chancellor']), (req, res) => {
    // Total active library users vs. total student population
    const activeUsers = db.prepare(`SELECT count(DISTINCT student_id) as count FROM fact_loans`).get() as { count: number };
    const totalStudents = db.prepare(`SELECT count(*) as count FROM dim_students`).get() as { count: number };
    
    // Engagement trend (Monthly library engagement)
    const engagement = db.prepare(`
        SELECT t.month || ' ' || t.year as period, count(*) as count 
        FROM fact_loans f 
        JOIN dim_time t ON f.time_id = t.time_id
        GROUP BY t.year, t.month_val 
        ORDER BY t.year DESC, t.month_val DESC 
        LIMIT 12
    `).all().reverse();

    // Strategic Benchmarks (Real Data)
    // 1. Retention Correlation: % of active users who have borrowed in > 1 distinct month (Loyalty)
    // If we can't easily do that without complex queries, let's use: Active Users / Total Students * 100
    // Actually, "Active Users / Total Students" is a solid metric for "Retention" in this context (Reach).
    const retentionRate = totalStudents.count > 0 ? Math.round((activeUsers.count / totalStudents.count) * 100) : 0;

    // 2. Digital Transition: % of loans that are Digital
    const totalLoans = db.prepare('SELECT count(*) as count FROM fact_loans').get() as { count: number };
    const digitalLoans = db.prepare(`
        SELECT count(*) as count 
        FROM fact_loans f 
        JOIN dim_books b ON f.book_isbn = b.isbn 
        WHERE b.format = 'Digital' OR b.format = 'E-Book'
    `).get() as { count: number };
    
    const digitalTransition = totalLoans.count > 0 ? Math.round((digitalLoans.count / totalLoans.count) * 100) : 0;

    res.json({
        activeUsers: activeUsers.count,
        totalStudents: totalStudents.count,
        engagement,
        retentionRate,
        digitalTransition
    });
});

router.get('/dashboard/vc/heatmap', authenticateToken, requireRole(['Vice-chancellor']), (req, res) => {
   // Heat Map: Resource utilization across different faculties
   const usage = db.prepare(`
     SELECT s.faculty, b.category, count(*) as value
     FROM fact_loans f
     JOIN dim_students s ON f.student_id = s.student_id
     JOIN dim_books b ON f.book_isbn = b.isbn
     GROUP BY s.faculty, b.category
   `).all();
   res.json(usage);
});

// 2. Departmental Heads
router.get('/dashboard/dh/stats', authenticateToken, requireRole(['Departmental Head', 'Vice-chancellor']), (req, res) => {
    // For prototype, we assume the logged-in DH belongs to 'Science' if no mapping exists, or pass query param
    const faculty = req.query.faculty || 'Science';

    // Bar Chart: Most borrowed book categories within their department
    const categories = db.prepare(`
        SELECT b.category as name, count(*) as value
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        JOIN dim_books b ON f.book_isbn = b.isbn
        WHERE s.faculty = ?
        GROUP BY b.category
        ORDER BY value DESC
        LIMIT 5
    `).all(faculty);

    // Pie Chart: Digital vs Physical (Real Data)
    const resources = db.prepare(`
        SELECT b.format as name, count(*) as value
        FROM fact_loans f
        JOIN dim_students s ON f.student_id = s.student_id
        JOIN dim_books b ON f.book_isbn = b.isbn
        WHERE s.faculty = ?
        GROUP BY b.format
    `).all(faculty);

    // Comparison Table: Dept vs Avg
    const deptTotal = db.prepare(`
        SELECT count(*) as count FROM fact_loans f JOIN dim_students s ON f.student_id = s.student_id WHERE s.faculty = ?
    `).get(faculty) as { count: number };
    
    const uniAvg = db.prepare(`
        SELECT count(*) / (SELECT count(DISTINCT faculty) FROM dim_students) as avg FROM fact_loans
    `).get() as { avg: number };

    res.json({
        categories,
        resources,
        comparison: {
            department: deptTotal.count,
            universityAvg: Math.round(uniAvg.avg)
        }
    });
});

// 3. Admission Director
router.get('/dashboard/ad/stats', authenticateToken, requireRole(['Admission Director', 'Vice-chancellor']), (req, res) => {
    // Demographic Map (Real Data)
    const regions = db.prepare(`
        SELECT region as name, count(*) as value
        FROM dim_students
        GROUP BY region
    `).all();

    // Gauge Chart: % of "Top Tier" resources (Simulated based on 'Science'/'Medicine' categories being 'Top Tier')
    const topTierCount = db.prepare(`
        SELECT count(*) as count FROM dim_books WHERE category IN ('Science', 'Medicine', 'Technology')
    `).get() as { count: number };
    const totalBooks = db.prepare('SELECT count(*) as count FROM dim_books').get() as { count: number };
    const topTierPercentage = Math.round((topTierCount.count / totalBooks.count) * 100);

    // Growth Chart: Year-on-year loans (Real Data)
    const growth = db.prepare(`
        SELECT t.year, count(f.fact_id) as subscriptions
        FROM fact_loans f
        JOIN dim_time t ON f.time_id = t.time_id
        GROUP BY t.year
        ORDER BY t.year
    `).all();

    res.json({ regions, topTierPercentage, growth });
});

// 4. Finance Director
router.get('/dashboard/fd/financials', authenticateToken, requireRole(['Finance Director', 'Vice-chancellor']), (req, res) => {
    // Waterfall: Budget vs Actual (Real Data)
    const currentYear = new Date().getFullYear();
    const budgetData = db.prepare('SELECT total_budget, spent_budget FROM sys_budget WHERE year = ?').get(currentYear) as any || { total_budget: 500000, spent_budget: 0 };
    
    const budget = budgetData.total_budget;
    const spending = budgetData.spent_budget;
    
    // Revenue from fines over time
    const finesTrend = db.prepare(`
        SELECT t.year, sum(f.fine_amount) as revenue
        FROM fact_loans f
        JOIN dim_time t ON f.time_id = t.time_id
        GROUP BY t.year
        ORDER BY t.year
    `).all();

    // Outstanding replacement costs (Real Data: Price of overdue books)
    const lostCostResult = db.prepare(`
        SELECT SUM(ob.price) as val
        FROM fact_loans f
        JOIN op_books ob ON f.book_isbn = ob.isbn
        WHERE f.is_overdue = 1
    `).get() as { val: number };
    
    const lostCost = lostCostResult.val || 0;

    res.json({
        budget: { total: budget, spent: spending, remaining: budget - spending },
        finesTrend,
        lostCost
    });
});

// 5. Chief Librarian
router.get('/dashboard/cl/ops', authenticateToken, requireRole(['Chief Librarian', 'Vice-chancellor']), (req, res) => {
    // Inventory: On Loan vs On Shelf
    const onLoan = db.prepare('SELECT count(*) as count FROM fact_loans WHERE loan_duration IS NULL').get() as { count: number };
    const totalBooks = db.prepare('SELECT count(*) as count FROM dim_books').get() as { count: number };
    
    // Top 10 Borrowed
    const topBooks = db.prepare(`
        SELECT b.title, count(*) as loans
        FROM fact_loans f
        JOIN dim_books b ON f.book_isbn = b.isbn
        GROUP BY b.isbn
        ORDER BY loans DESC
        LIMIT 10
    `).all();

    // Dead Stock
    const deadStock = db.prepare(`
        SELECT count(*) as count FROM dim_books b 
        LEFT JOIN fact_loans f ON b.isbn = f.book_isbn 
        WHERE f.fact_id IS NULL
    `).get() as { count: number };

    // Security Logs
    const authLogs = db.prepare('SELECT * FROM sys_auth_logs ORDER BY timestamp DESC LIMIT 20').all();

    res.json({
        inventory: { onLoan: onLoan.count, onShelf: totalBooks.count - onLoan.count },
        topBooks,
        deadStock: deadStock.count,
        authLogs
    });
});

// --- Data Explorer Routes ---
router.get('/data/:table', authenticateToken, requireRole(['Vice-chancellor', 'Chief Librarian']), (req, res) => {
  const table = req.params.table;
  const allowedTables = ['op_books', 'op_students', 'op_loans', 'dim_books', 'dim_students', 'dim_time', 'fact_loans'];
    
    if (typeof table !== 'string' || !allowedTables.includes(table)) {
        return res.status(400).json({ message: 'Invalid table' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const data = db.prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`).all(limit, offset);
        const count = db.prepare(`SELECT count(*) as total FROM ${table}`).get() as { total: number };
        
        res.json({
            data,
            meta: {
                total: count.total,
                page,
                limit,
                pages: Math.ceil(count.total / limit)
            }
        });
    } catch (e) {
        res.status(500).json({ message: 'Database error' });
    }
});

export default router;
