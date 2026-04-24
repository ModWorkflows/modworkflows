const { supabaseAdmin } = require('../lib/supabase');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const { data: existing } = await supabaseAdmin.from('access_requests').select('id, status').eq('email', email.toLowerCase()).maybeSingle();
  if (existing) {
    const msg = existing.status === 'approved' ? 'Your application has already been approved. Check your email for an invite.' : 'Your application is already on file. We will be in touch.';
    return res.status(200).json({ success: true, message: msg });
  }

  const { error } = await supabaseAdmin.from('access_requests').insert({ email: email.toLowerCase(), status: 'pending' });
  if (error) { console.error('apply error:', error); return res.status(500).json({ error: 'Something went wrong. Please try again.' }); }

  return res.status(200).json({ success: true, message: 'Application received. We will review it and reach out directly.' });
};
