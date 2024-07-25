import express from 'express';
import cors from "cors";

import data from './route/data.js';
const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use('/api', data);

app.get('/manish', (req, res) => {
    res.send('Hello World');
});

export default app;