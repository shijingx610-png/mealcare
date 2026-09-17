// GET /api/sources — 情報源カタログとタグ一覧を返す
import { SOURCES } from '../server/sources.js';
import { TAGS } from '../server/taxonomy.js';
import { GLOSSARY } from '../server/glossary.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json({
    sources: SOURCES,
    tags: TAGS,
    glossarySize: GLOSSARY.length,
    claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY)
  });
}
