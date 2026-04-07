const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function initDB() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      reward_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      location TEXT DEFAULT '',
      skill TEXT DEFAULT 'General Collection',
      rating REAL DEFAULT 5.0,
      availability INTEGER DEFAULT 1,
      earnings REAL DEFAULT 0,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'worker',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pickup_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      waste_type TEXT NOT NULL,
      device_description TEXT DEFAULT '',
      address TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      status TEXT DEFAULT 'Assigned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (request_id) REFERENCES pickup_requests(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      amount REAL DEFAULT 150,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      rating INTEGER DEFAULT 5,
      comment TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
  `);

  // Seed admin
  const admin = await db.getAsync("SELECT id FROM users WHERE email = 'admin@ewaste.com'");
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.runAsync(`INSERT INTO users (name, email, phone, address, password_hash, role) VALUES (?,?,?,?,?,?)`,
      ['Admin', 'admin@ewaste.com', '9999999999', 'HQ', hash, 'admin']);
  }

  // Seed workers
  const workerCheck = await db.getAsync("SELECT id FROM workers WHERE email = 'ravi@worker.com'");
  if (!workerCheck) {
    const hash = bcrypt.hashSync('worker123', 10);
    const workers = [
      ['Ravi Kumar',  'ravi@worker.com',  '9876543210', 'Delhi',     'Electronics Recycling'],
      ['Priya Singh', 'priya@worker.com', '9876543211', 'Mumbai',    'Battery Disposal'],
      ['Amit Sharma', 'amit@worker.com',  '9876543212', 'Bangalore', 'General Collection'],
    ];
    for (const [name, email, phone, location, skill] of workers) {
      await db.runAsync(`INSERT INTO workers (name, email, phone, location, skill, password_hash) VALUES (?,?,?,?,?,?)`,
        [name, email, phone, location, skill, hash]);
    }
  }

  // Seed demo user
  const demoUser = await db.getAsync("SELECT id FROM users WHERE email = 'user@ewaste.com'");
  if (!demoUser) {
    const hash = bcrypt.hashSync('user123', 10);
    await db.runAsync(`INSERT INTO users (name, email, phone, address, password_hash, role, reward_points) VALUES (?,?,?,?,?,?,?)`,
      ['Demo User', 'user@ewaste.com', '9123456780', 'New Delhi', hash, 'user', 50]);
  }

  console.log('✅ Database initialized successfully');
}

module.exports = initDB;
