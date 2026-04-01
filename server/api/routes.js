import { Router } from 'express';
import { parseCode } from '../parser/index.js';
import { explainCode } from '../llm/index.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/parse', (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });
    const result = parseCode(code, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/explain', async (req, res) => {
  try {
    const { code, mode } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });
    const result = await explainCode(code, mode || 'with_ast');
    res.json(result);
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({ error: err.message });
  }
});
