const db = require('../config/db');

async function autoAssignWorker(address) {
  const words = address.split(/[\s,]+/).filter(w => w.length >= 3);
  for (const word of words) {
    const worker = await db.getAsync(
      "SELECT * FROM workers WHERE availability = 1 AND LOWER(location) LIKE LOWER(?)", [`%${word}%`]
    );
    if (worker) return worker;
  }
  return await db.getAsync("SELECT * FROM workers WHERE availability = 1 LIMIT 1");
}

exports.createPickupRequest = async (req, res) => {
  const { waste_type, device_description, address, scheduled_date } = req.body;
  const user_id = req.user.id;
  if (!waste_type || !address || !scheduled_date)
    return res.status(400).json({ error: 'Waste type, address, and scheduled date are required.' });
  try {
    const requestResult = await db.runAsync(
      `INSERT INTO pickup_requests (user_id, waste_type, device_description, address, scheduled_date, status) VALUES (?,?,?,?,?,'Pending')`,
      [user_id, waste_type, device_description || '', address, scheduled_date]
    );
    const requestId = requestResult.lastID;
    const worker = await autoAssignWorker(address);
    if (worker) {
      const jobResult = await db.runAsync("INSERT INTO jobs (request_id, worker_id, status) VALUES (?,?,'Assigned')", [requestId, worker.id]);
      await db.runAsync("INSERT INTO payments (job_id, amount, status) VALUES (?,150,'Pending')", [jobResult.lastID]);
      await db.runAsync("UPDATE workers SET availability = 0 WHERE id = ?", [worker.id]);
      await db.runAsync("UPDATE pickup_requests SET status = 'Assigned' WHERE id = ?", [requestId]);
      await db.runAsync("UPDATE users SET reward_points = reward_points + 20 WHERE id = ?", [user_id]);
      return res.status(201).json({ message: 'Pickup request created and worker assigned!', request_id: requestId, assigned_worker: { name: worker.name, location: worker.location }, reward_points_earned: 20 });
    }
    return res.status(201).json({ message: 'Pickup request created. Kept as Pending (no workers available).', request_id: requestId, assigned_worker: null });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.getMyRequests = async (req, res) => {
  try {
    const rows = await db.allAsync(`
      SELECT pr.*, j.id AS job_id, j.status AS job_status, w.name AS worker_name, w.phone AS worker_phone, w.location AS worker_location
      FROM pickup_requests pr
      LEFT JOIN jobs j ON pr.id = j.request_id
      LEFT JOIN workers w ON j.worker_id = w.id
      WHERE pr.user_id = ? ORDER BY pr.created_at DESC`, [req.user.id]);
    return res.json(rows);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.getAvailableWorkers = async (req, res) => {
  try {
    return res.json(await db.allAsync("SELECT id, name, location, skill, rating, availability FROM workers WHERE availability = 1"));
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
