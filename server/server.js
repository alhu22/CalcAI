import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/router.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use the router for message-related requests
app.use('/api', router);

// Basic route
app.get('/', (req, res) => {
    res.send('Hello from the server!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
