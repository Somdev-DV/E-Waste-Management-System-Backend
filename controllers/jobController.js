const db = require('../config/db');

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await db.allAsync(`
      SELECT j.*, pr.waste_type, pr.device_description, pr.address, pr.scheduled_date,
             pr.status AS request_status, u.name AS user_name, u.phone AS user_phone,
             p.amount, p.status AS payment_status
      FROM jobs j
      JOIN pickup_requests pr ON j.request_id = pr.id
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN payments p ON j.id = p.job_id
      WHERE j.worker_id = ? ORDER BY j.created_at DESC`, [req.user.id]);
    return res.json(jobs);
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.updateJobStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const worker_id = req.user.id;
  if (!['Accepted', 'Rejected', 'In Progress', 'Completed'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  try {
    const job = await db.getAsync('SELECT * FROM jobs WHERE id = ? AND worker_id = ?', [id, worker_id]);
    if (!job) return res.status(404).json({ error: 'Job not found or unauthorized.' });

    if (status === 'Rejected') {
      await db.runAsync("UPDATE workers SET availability = 1 WHERE id = ?", [worker_id]);
      await db.runAsync("UPDATE pickup_requests SET status = 'Pending' WHERE id = ?", [job.request_id]);
      await db.runAsync("DELETE FROM jobs WHERE id = ?", [id]);
      return res.json({ message: 'Job rejected. Request is Pending for re-assignment.' });
    }
    if (status === 'Completed') {
      await db.runAsync("UPDATE jobs SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
      await db.runAsync("UPDATE pickup_requests SET status = 'Completed' WHERE id = ?", [job.request_id]);
      await db.runAsync("UPDATE workers SET availability = 1, earnings = earnings + 150 WHERE id = ?", [worker_id]);
      await db.runAsync("UPDATE payments SET status = 'Paid' WHERE job_id = ?", [id]);
      return res.json({ message: 'Job completed! Earnings updated.' });
    }
    await db.runAsync("UPDATE jobs SET status = ? WHERE id = ?", [status, id]);
    await db.runAsync("UPDATE pickup_requests SET status = ? WHERE id = ?", [status, job.request_id]);
    return res.json({ message: `Job status updated to ${status}.` });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.assignJob = async (req, res) => {
  const { request_id, worker_id } = req.body;
  if (!request_id || !worker_id) return res.status(400).json({ error: 'request_id and worker_id required.' });
  try {
    const request = await db.getAsync("SELECT * FROM pickup_requests WHERE id = ?", [request_id]);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (request.status !== 'Pending') return res.status(400).json({ error: 'Request is not Pending.' });
    const worker = await db.getAsync("SELECT * FROM workers WHERE id = ?", [worker_id]);
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });

    const jobResult = await db.runAsync(
      "INSERT INTO jobs (request_id, worker_id, status) VALUES (?,?,'Assigned')", [request_id, worker_id]);
    await db.runAsync("INSERT INTO payments (job_id, amount) VALUES (?,150)", [jobResult.lastID]);
    await db.runAsync("UPDATE pickup_requests SET status = 'Assigned' WHERE id = ?", [request_id]);
    await db.runAsync("UPDATE workers SET availability = 0 WHERE id = ?", [worker_id]);
    return res.status(201).json({ message: 'Job assigned!', job_id: jobResult.lastID });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
