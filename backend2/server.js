// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS setup including PUT for preflight
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Ensure OPTIONS preflight handled
app.options('*', cors());

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// ===== DB Connection =====
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_system',
  multipleStatements: false
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to DB with id:', db.threadId);
});

// ===== Helpers =====
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 10 minutes.</p>`
    });
    console.log(` OTP sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
  }
};

const getUserById = (id, cb) => {
  db.query('SELECT id, name, email, role, is_verified, profile_picture FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return cb(err);
    if (results.length === 0) return cb(new Error('User not found'));
    cb(null, results[0]);
  });
};

// ===== Auth Middleware (centralized) =====
const { authMiddleware, adminOnly } = require('./middleware/auth');

// ===== Multer for profile pictures =====
// Note: frontend appends field name "picture"
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const userId = req.user?.id || 'anon';
    cb(null, `${userId}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const mimetype = allowed.test(file.mimetype);
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && ext) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, gif)'));
  }
});

// ===== Routes =====

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  const trimmedEmail = email.trim();

  db.query('SELECT id FROM users WHERE email = ?', [trimmedEmail], async (err, results) => {
    if (err) {
      console.error('DB error (select signup):', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length > 0) return res.status(400).json({ message: 'User already exists' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      const finalRole = role === 'admin' ? 'admin' : 'user';

      db.query(
        'INSERT INTO users (name, email, password, otp, otp_expiry, role) VALUES (?, ?, ?, ?, ?, ?)',
        [name, trimmedEmail, hashedPassword, otp, otpExpiry, finalRole],
        async (err) => {
          if (err) {
            console.error('DB error (insert user):', err);
            return res.status(500).json({ message: 'Database insert error' });
          }

          try { await sendOtpEmail(trimmedEmail, otp); } catch (e) { /* logged in helper */ }

          return res.status(201).json({ message: `User registered as ${finalRole}. Check email for OTP.` });
        }
      );
    } catch (hashErr) {
      console.error('Hash error:', hashErr);
      return res.status(500).json({ message: 'Server error' });
    }
  });
});

// Login (send OTP to verified accounts)
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const trimmedEmail = email.trim();

  db.query('SELECT * FROM users WHERE email = ?', [trimmedEmail], async (err, results) => {
    if (err) {
      console.error('DB error (login):', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = results[0];
    if (!user.is_verified) return res.status(400).json({ message: 'Please verify your account first' });

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    db.query('UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?', [otp, otpExpiry, trimmedEmail], async (err) => {
      if (err) {
        console.error('DB error (update otp):', err);
        return res.status(500).json({ message: 'Database update error' });
      }

      try { await sendOtpEmail(trimmedEmail, otp); } catch (e) { /* logged */ }
      return res.json({ message: 'Login OTP sent to your email' });
    });
  });
});

// Verify OTP (signup or login)
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  const trimmedEmail = email.trim();
  const trimmedOtp = otp.toString().trim();

  db.query('SELECT * FROM users WHERE email = ?', [trimmedEmail], (err, results) => {
    if (err) {
      console.error('DB error (verify):', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = results[0];
    if (user.otp?.toString().trim() !== trimmedOtp) return res.status(400).json({ message: 'Invalid OTP' });
    if (!user.otp_expiry || new Date() > new Date(user.otp_expiry)) return res.status(400).json({ message: 'OTP expired' });

    db.query('UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL WHERE email = ?', [trimmedEmail], (err) => {
      if (err) {
        console.error('DB error (set verified):', err);
        return res.status(500).json({ message: 'Database update error' });
      }

      // fetch fresh user from DB so we return the up-to-date profile_picture and role
      getUserById(user.id, (getErr, freshUser) => {
        if (getErr) {
          console.error('DB error (fetch user after verify):', getErr);
          return res.status(500).json({ message: 'Database error' });
        }

        // build full URL for profile picture if present
        const profilePictureUrl = freshUser.profile_picture
          ? `${req.protocol}://${req.get('host')}/uploads/${freshUser.profile_picture}`
          : null;

        // create fresh token using current DB user values (role etc.)
        const token = jwt.sign(
          { userId: freshUser.id, email: freshUser.email, name: freshUser.name, role: freshUser.role },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '1h' }
        );

        return res.json({
          message: 'Account verified successfully',
          token,
          user: {
            id: freshUser.id,
            name: freshUser.name,
            email: freshUser.email,
            role: freshUser.role,
            profile_picture: freshUser.profile_picture,
            profile_picture_url: profilePictureUrl
          }
        });
      });
    });
  });
});

// (uploads static serving set earlier)

// Endpoint to get user by ID
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  getUserById(userId, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message || 'Database error' });
    }

    // attach full URL for profile picture if it exists
    if (user.profile_picture) {
      user.profile_picture_url = `${req.protocol}://${req.get('host')}/uploads/${user.profile_picture}`;
    } else {
      user.profile_picture_url = null;
    }

    return res.json(user);
  });
});

// User Dashboard
app.get('/api/auth/dashboard', authMiddleware, (req, res) => {
  return res.json({ message: 'Welcome to user dashboard', user: req.user });
});

// Admin Dashboard
app.get('/api/admin/dashboard', authMiddleware, adminOnly, (req, res) => {
  return res.json({ message: 'Welcome to the admin dashboard', user: req.user });
});

// Admin: Get all users
app.get('/api/admin/users', authMiddleware, adminOnly, (req, res) => {
  db.query('SELECT id, name, email, role, is_verified, profile_picture FROM users', (err, results) => {
    if (err) {
      console.error('DB fetch error (admin users):', err);
      return res.status(500).json({ message: 'Database error' });
    }
    // normalize profile_picture -> profile_picture_url for each user
    const users = results.map(u => ({
      ...u,
      profile_picture_url: u.profile_picture ? `${req.protocol}://${req.get('host')}/uploads/${u.profile_picture}` : null
    }));
    return res.json({ users });
  });
});


// Update Profile (updates DB and returns updated user)
app.put('/api/auth/update-profile', authMiddleware, (req, res) => {
  const { name, email, password } = req.body;
  const updates = [];
  const values = [];

  if (name) { 
    updates.push('name = ?'); 
    values.push(name); 
  }
  if (email) { 
    updates.push('email = ?'); 
    values.push(email); 
  }
  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    updates.push('password = ?'); values.push(hashed);
  }

  if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

  values.push(req.user.userId);
  console.log('Profile update values:', updates);

  db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
    if (err) {
      console.error('DB error (update-profile):', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // fetch updated user and return
    getUserById(req.user.userId, (err, updatedUser) => {
      if (err) {
        console.error('DB error (fetch updated user):', err);
        return res.status(500).json({ message: 'Database error' });
      }
      // convert profile_picture to URL if exists
      if (updatedUser.profile_picture) {
        updatedUser.profile_picture = `${req.protocol}://${req.get('host')}/uploads/${updatedUser.profile_picture}`;
      }
      return res.json({ message: 'Profile updated successfully', user: updatedUser });
    });
  });
});

// Upload Profile Picture (expects field name 'picture')
app.post('/api/auth/profile-picture', authMiddleware, upload.single('picture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filename = req.file.filename;

  db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [filename, req.user.userId], (err) => {
    if (err) {
      console.error('DB error (update profile picture):', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // fetch updated user and return
    getUserById(req.user.userId, (err, updatedUser) => {
      if (err) {
        console.error('DB error (fetch after picture):', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (updatedUser.profile_picture) {
        updatedUser.profile_picture = `${req.protocol}://${req.get('host')}/uploads/${updatedUser.profile_picture}`;
      }
      return res.json({
        message: 'Profile picture updated',
        profile_picture: filename,
        profile_picture_url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
        user: updatedUser
      });
    });
  });
});

// ===== Start server =====
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
