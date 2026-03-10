import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { seedData } from './seed.js';
import routes from './routes.js';
import { runETL } from './etl.js';

const app = express();
const PORT = 3001; // Running on 3001 to avoid conflict if 3000 is used by Vite (though Vite usually uses 5173 or 3000)

app.use(cors());
app.use(express.json());

// Initialize Database
initDb();
seedData();

// Run initial ETL to ensure warehouse has data
runETL();

// Routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
