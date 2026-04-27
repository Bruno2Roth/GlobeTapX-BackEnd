const app = require('./src/app/app');
const env = require('./src/config/env');

const PORT = env.port || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
