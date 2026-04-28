import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, company, qty, budget, garmentTypes, notes, designFileUrl } = req.body || {};

  if (!firstName || !email) return res.status(400).json({ error: 'First name and email are required.' });

  const { data, error } = await supabaseAdmin
    .from('clothing_submissions')
    .insert([{ first_name: firstName, last_name: lastName || '', email, company: company || '', qty: qty || '', budget: budget || '', garment_types: garmentTypes || '', notes: notes || '', design_file_url: designFileUrl || '', status: 'new' }])
    .select().single();

  if (error) { console.error('clothing submission error:', error); return res.status(500).json({ error: error.message }); }

  if (process.env.RESEND_API_KEY) {
    try {
      const g = garmentTypes || 'Not specified';
      const html = '<div style="font-family:sans-serif"><h2>New Clothing Submission</h2><p><b>Name:</b> ' + firstName + ' ' + (lastName||'') + '</p><p><b>Email:</b> ' + email + '</p><p><b>Company:</b> ' + (company||'--') + '</p><p><b>Garments:</b> ' + g + '</p><p><b>MOQ:</b> ' + (qty||'--') + '</p><p><b>Budget:</b> ' + (budget||'--') + '</p><p><b>Notes:</b> ' + (notes||'--') + '</p><p><b>Design:</b> ' + (designFileUrl ? '<a href="'+designFileUrl+'">View</a>' : 'None') + '</p><p><a href="https://modworkflows.ai/admin.html">View in Admin</a></p></div>';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'ModWorkflows <notifications@modworkflows.ai>', to: ['ardenmod570@outlook.com'], subject: 'New Clothing Request -- ' + firstName + ' ' + (lastName||'') + ' (' + g + ')', html })
      });
    } catch (e) { console.error('email error:', e); }
  }

  return res.status(200).json({ success: true, id: data.id });
}
