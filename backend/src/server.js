require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Skynexa server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
