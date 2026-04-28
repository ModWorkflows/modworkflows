import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://modworkflows.ai'
    });

    if (error) {
      // Already registered — treat as success so the admin flow doesn't break
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('exists')) {
        return res.status(200).json({ success: true, message: 'User already has an account.' });
      }
      console.error('invite error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      userId: data.user.id,
      message: 'Invite sent successfully.'
    });
  } catch (e) {
    console.error('invite error:', e);
    return res.status(500).json({ error: e.message });
  }
}
