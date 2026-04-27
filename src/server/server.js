const app = require('../app/app');
const env = require('../config/env');

const port = env.port || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
