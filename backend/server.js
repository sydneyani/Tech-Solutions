const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Simple backend is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Simple backend running on port ${PORT}`);
});
