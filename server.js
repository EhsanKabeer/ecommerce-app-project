/*
 * server.js
 *
 * This is a basic e‑commerce server built with Node.  It doesn’t use
 * any extra libraries.  The server serves the HTML, CSS and JS from
 * the client folder and has a small API to list products and take
 * orders.  It’s meant to show the core ideas without a lot of
 * complexity.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Hard‑coded product catalogue.  In a real application this data would
// reside in a database.  Each product has an id, name, description,
// price and an image URL (placeholder images are used).
const products = [
  {
    id: 1,
    name: 'Wireless Mouse',
    description: 'Ergonomic Bluetooth mouse with adjustable DPI.',
    price: 29.99,
    image: 'https://via.placeholder.com/150?text=Mouse'
  },
  {
    id: 2,
    name: 'Mechanical Keyboard',
    description: 'Tactile mechanical keyboard with RGB backlighting.',
    price: 79.99,
    image: 'https://via.placeholder.com/150?text=Keyboard'
  },
  {
    id: 3,
    name: 'Noise Cancelling Headphones',
    description: 'Over‑ear headphones with active noise cancellation.',
    price: 129.99,
    image: 'https://via.placeholder.com/150?text=Headphones'
  },
  {
    id: 4,
    name: 'USB‑C Hub',
    description: 'Seven‑port USB‑C hub with 4K HDMI output and PD.',
    price: 49.99,
    image: 'https://via.placeholder.com/150?text=USB-C+Hub'
  },
  {
    id: 5,
    name: 'Portable SSD',
    description: '512 GB NVMe portable SSD with USB 3.2 Gen 2.',
    price: 99.99,
    image: 'https://via.placeholder.com/150?text=SSD'
  }
];

/**
 * Serve a static file from the client directory.
 *
 * @param {http.ServerResponse} res
 * @param {string} filePath
 */
function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

/**
 * Handle API requests and static file serving.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/products' && req.method === 'GET') {
    // Return the product catalogue as JSON
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
    return;
  }

  if (pathname === '/api/order' && req.method === 'POST') {
    // Collect POST data
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      let items;
      try {
        items = JSON.parse(body);
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('Order must be a non‑empty array');
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }
      // Validate items and calculate total
      let total = 0;
      for (const item of items) {
        const { id, quantity } = item;
        const product = products.find(p => p.id === id);
        if (!product) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Unknown product id ${id}` }));
          return;
        }
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Invalid quantity for product ${id}` }));
          return;
        }
        total += product.price * qty;
      }
      // Simulate persistence (e.g. save to database) and return order summary
      const orderId = Date.now();
      console.log('Processed order', orderId, 'for items', items);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, orderId, total }));
    });
    return;
  }

  // Serve static files from the client folder.  Default to index.html.
  let filePath = path.join(__dirname, 'client', pathname === '/' ? 'index.html' : pathname);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File does not exist; return 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    serveStatic(res, filePath);
  });
}

const PORT = process.env.PORT || 3000;
const server = http.createServer(requestHandler);
server.listen(PORT, () => {
  console.log(`E‑Commerce server running at http://localhost:${PORT}`);
});