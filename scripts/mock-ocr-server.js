const http = require('http');

const port = process.env.MOCK_OCR_PORT || 8787;

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/process-receipt') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      console.log('Mock OCR received:', body);
      const parsed = {
        total: 1200.0,
        items: [
          { name: 'Jollof Rice', price: 500.0, quantity: 1 },
          { name: 'Soda', price: 200.0, quantity: 2 },
        ],
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, parsed }));
    });
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(port, () =>
  console.log(`Mock OCR server listening on http://localhost:${port}`)
);
