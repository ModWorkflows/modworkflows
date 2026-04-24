const { supabase, supabaseAdmin } = require('../lib/supabase');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  let isAuthed = false;

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    isAuthed = !!user;
  }

  if (!isAuthed) {
    const { data: salaryPreview } = await supabaseAdmin
      .from('salary_data')
      .select('role, tag, low, high, median, demand')
      .order('sort_order')
      .limit(3);
    return res.status(200).json({ preview: true, salary: salaryPreview || [], message: 'Full access requires a ModWorkflows subscription' });
  }

  const [salary, rates, certs, modules, trend] = await Promise.all([
    supabaseAdmin.from('salary_data').select('*').order('sort_order'),
    supabaseAdmin.from('rate_data').select('*').order('sort_order'),
    supabaseAdmin.from('cert_data').select('*'),
    supabaseAdmin.from('module_data').select('*').order('pct', { ascending: false }),
    supabaseAdmin.from('trend_data').select('*').order('year')
  ]);

  return res.status(200).json({ preview: false, salary: salary.data || [], rates: rates.data || [], certs: certs.data || [], modules: modules.data || [], trend: trend.data || [] });
};
