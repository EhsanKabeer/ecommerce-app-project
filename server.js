const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-secret';
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const envDbPath = process.env.DATABASE_PATH;
const resolvedDbPath = envDbPath
  ? path.isAbsolute(envDbPath)
    ? envDbPath
    : path.resolve(__dirname, envDbPath)
  : path.join(DEFAULT_DATA_DIR, 'app.db');
const DB_PATH = resolvedDbPath;
const DB_DIRECTORY = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIRECTORY)) {
  fs.mkdirSync(DB_DIRECTORY, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      hashedPassword TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
});

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
    description: 'Over-ear headphones with active noise cancellation.',
    price: 129.99,
    image: 'https://via.placeholder.com/150?text=Headphones'
  },
  {
    id: 4,
    name: 'USB-C Hub',
    description: 'Seven-port USB-C hub with 4K HDMI output and PD.',
    price: 49.99,
    image: 'https://via.placeholder.com/150?text=USB-C+Hub'
  },
  {
    id: 5,
    name: 'Portable SSD',
    description: '512 GB NVMe portable SSD with USB 3.2 Gen 2.',
    price: 99.99,
    image: 'https://via.placeholder.com/150?text=SSD'
  }
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256');
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(hashHex, 'hex');
  const actualHash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256');
  return crypto.timingSafeEqual(expectedHash, actualHash);
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use((req, res, next) => {
  const { userId } = req.session;
  if (!userId) {
    req.user = null;
    return next();
  }
  db.get(
    'SELECT id, username, email, createdAt, updatedAt FROM users WHERE id = ?',
    [userId],
    (err, row) => {
      if (err) {
        return next(err);
      }
      if (!row) {
        delete req.session.userId;
        req.user = null;
        return next();
      }
      req.user = row;
      return next();
    }
  );
});

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
}

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/session', (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.post('/api/signup', (req, res, next) => {
  const { username, email, password } = req.body || {};
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const emailRegex = /.+@.+\..+/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], (err, existing) => {
    if (err) return next(err);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const now = new Date().toISOString();
    const hashedPassword = hashPassword(password);
    db.run(
      'INSERT INTO users (username, email, hashedPassword, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), normalizedEmail, hashedPassword, now, now],
      function (insertErr) {
        if (insertErr) return next(insertErr);
        const newUserId = this.lastID;
        req.session.regenerate(regenerateErr => {
          if (regenerateErr) return next(regenerateErr);
          req.session.userId = newUserId;
          db.get(
            'SELECT id, username, email, createdAt, updatedAt FROM users WHERE id = ?',
            [newUserId],
            (selectErr, userRow) => {
              if (selectErr) return next(selectErr);
              res.status(201).json({ user: sanitizeUser(userRow) });
            }
          );
        });
      }
    );
  });
});

app.post('/api/login', (req, res, next) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], (err, userRow) => {
    if (err) return next(err);
    if (!userRow || !verifyPassword(password, userRow.hashedPassword)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.regenerate(regenerateErr => {
      if (regenerateErr) return next(regenerateErr);
      req.session.userId = userRow.id;
      res.json({ user: sanitizeUser(userRow) });
    });
  });
});

app.post('/api/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

app.get('/api/account', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.put('/api/account', requireAuth, (req, res, next) => {
  const { username, email } = req.body || {};
  const updates = [];
  const values = [];

  if (typeof username === 'string' && username.trim().length > 0 && username.trim() !== req.user.username) {
    updates.push('username = ?');
    values.push(username.trim());
  }

  if (typeof email === 'string' && email.trim().toLowerCase() !== req.user.email) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    updates.push('email = ?');
    values.push(normalizedEmail);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No changes provided' });
  }

  const finishUpdate = () => {
    const now = new Date().toISOString();
    updates.push('updatedAt = ?');
    values.push(now, req.user.id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.run(sql, values, function (err) {
      if (err) return next(err);
      db.get(
        'SELECT id, username, email, createdAt, updatedAt FROM users WHERE id = ?',
        [req.user.id],
        (selectErr, row) => {
          if (selectErr) return next(selectErr);
          req.user = row;
          res.json({ user: sanitizeUser(row) });
        }
      );
    });
  };

  const emailIndex = updates.findIndex(update => update.startsWith('email ='));
  if (emailIndex !== -1) {
    const emailValue = values[emailIndex];
    db.get('SELECT id FROM users WHERE email = ? AND id <> ?', [emailValue, req.user.id], (err, row) => {
      if (err) return next(err);
      if (row) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      finishUpdate();
    });
  } else {
    finishUpdate();
  }
});

app.delete('/api/account', requireAuth, (req, res, next) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password confirmation is required' });
  }

  db.get('SELECT hashedPassword FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return next(err);
    if (!row || !verifyPassword(password, row.hashedPassword)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    db.serialize(() => {
      db.run('DELETE FROM orders WHERE userId = ?', [req.user.id]);
      db.run('DELETE FROM users WHERE id = ?', [req.user.id], deleteErr => {
        if (deleteErr) return next(deleteErr);
        req.session.destroy(sessionErr => {
          if (sessionErr) return next(sessionErr);
          res.clearCookie('connect.sid');
          res.status(204).end();
        });
      });
    });
  });
});

app.get('/api/orders', requireAuth, (req, res, next) => {
  db.all(
    'SELECT id, items, total, createdAt FROM orders WHERE userId = ? ORDER BY datetime(createdAt) DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return next(err);
      const orders = rows.map(row => ({
        id: row.id,
        items: JSON.parse(row.items),
        total: row.total,
        createdAt: row.createdAt
      }));
      res.json({ orders });
    }
  );
});

app.post('/api/order', requireAuth, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  if (items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order must be a non-empty array' });
  }

  let total = 0;
  for (const item of items) {
    const { id, quantity } = item;
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(400).json({ success: false, error: `Unknown product id ${id}` });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: `Invalid quantity for product ${id}` });
    }
    total += product.price * qty;
  }

  const now = new Date().toISOString();
  db.run(
    'INSERT INTO orders (userId, items, total, createdAt) VALUES (?, ?, ?, ?)',
    [req.user.id, JSON.stringify(items), total, now],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to save order' });
      }
      res.json({ success: true, orderId: this.lastID, total });
    }
  );
});

app.use(express.static(path.join(__dirname, 'client')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`E-Commerce server running at http://localhost:${PORT}`);
});
