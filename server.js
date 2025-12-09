const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route for calculator operations
app.post('/calculate', (req, res) => {
  const { operation, num1, num2 } = req.body;
  
  let result;
  try {
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    
    switch(operation) {
      case 'add':
        result = n1 + n2;
        break;
      case 'subtract':
        result = n1 - n2;
        break;
      case 'multiply':
        result = n1 * n2;
        break;
      case 'divide':
        if (n2 === 0) {
          return res.status(400).json({ error: 'Cannot divide by zero' });
        }
        result = n1 / n2;
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
    
    res.json({ result: result.toFixed(2) });
  } catch (error) {
    res.status(400).json({ error: 'Invalid numbers provided' });
  }
});

// Health check endpoint for render.com
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple Computer running on port ${PORT}`);
});