import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`ICUL server running on http://localhost:${PORT}`);
});
