const db = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.allAsync(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.reward_points, u.created_at,
             COUNT(pr.id) AS total_requests
      FROM users u LEFT JOIN pickup_requests pr ON u.id = pr.user_id
      WHERE u.role='user' GROUP BY u.id ORDER BY u.created_at DESC`);
    return res.json(users);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await db.allAsync(`
      SELECT w.id, w.name, w.email, w.phone, w.location, w.skill, w.rating,
             w.availability, w.earnings, w.created_at,
             COUNT(j.id) AS total_jobs,
             SUM(CASE WHEN j.status='Completed' THEN 1 ELSE 0 END) AS completed_jobs
      FROM workers w LEFT JOIN jobs j ON w.id = j.worker_id
      GROUP BY w.id ORDER BY w.created_at DESC`);
    return res.json(workers);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await db.allAsync(`
      SELECT pr.*, u.name AS user_name,
             j.id AS job_id, j.status AS job_status,
             w.name AS worker_name, w.phone AS worker_phone
      FROM pickup_requests pr
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN jobs j ON pr.id = j.request_id
      LEFT JOIN workers w ON j.worker_id = w.id
      ORDER BY pr.created_at DESC`);
    return res.json(requests);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.toggleWorkerAvailability = async (req, res) => {
  try {
    const worker = await db.getAsync('SELECT * FROM workers WHERE id=?', [req.params.id]);
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });
    const newAvail = worker.availability === 1 ? 0 : 1;
    await db.runAsync("UPDATE workers SET availability=? WHERE id=?", [newAvail, req.params.id]);
    return res.json({ message: `Worker is now ${newAvail === 1 ? 'Available' : 'Unavailable'}.` });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
