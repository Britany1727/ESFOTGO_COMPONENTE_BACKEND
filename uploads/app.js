const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/upload.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', uploadRoutes);

app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});