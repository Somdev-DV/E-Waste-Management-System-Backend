const db = require('../config/db');

exports.getUserDashboard = async (req, res) => {
  const uid = req.user.id;
  try {
    const user = await db.getAsync(
      'SELECT id, name, email, phone, address, reward_points, created_at FROM users WHERE id = ?', [uid]);
    const stats = await db.getAsync(`
      SELECT COUNT(*) AS total_requests,
        SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='Assigned' THEN 1 ELSE 0 END) AS assigned,
        SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completed
      FROM pickup_requests WHERE user_id=?`, [uid]);
    const recentRequests = await db.allAsync(`
      SELECT pr.*, j.status AS job_status, w.name AS worker_name
      FROM pickup_requests pr
      LEFT JOIN jobs j ON pr.id = j.request_id
      LEFT JOIN workers w ON j.worker_id = w.id
      WHERE pr.user_id=? ORDER BY pr.created_at DESC LIMIT 5`, [uid]);
    return res.json({ user, stats, recentRequests });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.getWorkerDashboard = async (req, res) => {
  const wid = req.user.id;
  try {
    const worker = await db.getAsync(
      'SELECT id, name, email, phone, location, skill, rating, availability, earnings FROM workers WHERE id=?', [wid]);
    const stats = await db.getAsync(`
      SELECT COUNT(*) AS total_jobs,
        SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completed_jobs,
        SUM(CASE WHEN status='Assigned' THEN 1 ELSE 0 END) AS pending_jobs
      FROM jobs WHERE worker_id=?`, [wid]);
    const recentJobs = await db.allAsync(`
      SELECT j.*, pr.waste_type, pr.address, pr.scheduled_date, u.name AS user_name
      FROM jobs j
      JOIN pickup_requests pr ON j.request_id = pr.id
      JOIN users u ON pr.user_id = u.id
      WHERE j.worker_id=? ORDER BY j.created_at DESC LIMIT 5`, [wid]);
    return res.json({ worker, stats, recentJobs });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const overview = await db.getAsync(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='user') AS total_users,
        (SELECT COUNT(*) FROM workers) AS total_workers,
        (SELECT COUNT(*) FROM pickup_requests) AS total_requests,
        (SELECT COUNT(*) FROM jobs) AS total_jobs,
        (SELECT COUNT(*) FROM jobs WHERE status='Completed') AS completed_jobs,
        (SELECT COUNT(*) FROM pickup_requests WHERE status='Pending') AS pending_requests,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='Paid') AS total_earnings`);
    const wasteStats = await db.allAsync(
      `SELECT waste_type, COUNT(*) AS count FROM pickup_requests GROUP BY waste_type ORDER BY count DESC`);
    const recentRequests = await db.allAsync(`
      SELECT pr.*, u.name AS user_name, w.name AS worker_name
      FROM pickup_requests pr
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN jobs j ON pr.id = j.request_id
      LEFT JOIN workers w ON j.worker_id = w.id
      ORDER BY pr.created_at DESC LIMIT 10`);
    return res.json({ overview, wasteStats, recentRequests });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
