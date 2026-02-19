import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { countriesRouter } from './routes/countries';
import { companiesRouter } from './routes/companies';

dotenv.config();

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/countries', countriesRouter);
app.use('/api/companies', companiesRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => res.json({}));

app.listen(PORT, () => {
  console.log(`Trade Map API → http://localhost:${PORT}`);
});
