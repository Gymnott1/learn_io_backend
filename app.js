const express = require('express');
const { swaggerUi, swaggerSpec } = require('./configs/swaggerConfig');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;

