require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3307,
};

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const safeParseImages = (imagesData) => {
  if (!imagesData) return [];
  if (Array.isArray(imagesData)) return imagesData;
  try {
    const parsed = JSON.parse(imagesData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing images data:', error, 'Data:', imagesData);
    return [];
  }
};

// --- Registration Endpoints ---

// --- Forgot Password OTP Endpoint ---
const { sendOtpEmail } = require('./Mailer.js');
const crypto = require('crypto');

// Helper: Save OTP to DB
async function saveOtpToDb(email, otp) {
  const connection = await mysql.createConnection(dbConfig);
  const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    await connection.end();
    throw new Error('No user found with that email');
  }
  const userId = users[0].id;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await connection.execute(
    'INSERT INTO otp_codes (user_id, otp_code, expires_at, used) VALUES (?, ?, ?, ?)',
    [userId, otp, expiresAt, false]
  );
  await connection.end();
}

// Helper: Validate OTP
async function validateOtp(email, otp) {
  const connection = await mysql.createConnection(dbConfig);
  const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    await connection.end();
    return false;
  }
  const userId = users[0].id;
  const [rows] = await connection.execute(
    'SELECT * FROM otp_codes WHERE user_id = ? AND otp_code = ? AND used = FALSE AND expires_at > NOW()',
    [userId, otp]
  );
  if (rows.length === 0) {
    await connection.end();
    return false;
  }
  await connection.execute('UPDATE otp_codes SET used = TRUE WHERE id = ?', [rows[0].id]);
  await connection.end();
  return true;
}

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const otp = crypto.randomInt(100000, 999999).toString();

  try {
    await saveOtpToDb(email, otp);
    await sendOtpEmail(email, otp, { type: 'forgot-password' });
    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.status(500).json({ message: err.message || 'Failed to send OTP email.' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }
  try {
    const valid = await validateOtp(email, otp);
    if (!valid) return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    await connection.end();
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('Failed to reset password:', err);
    res.status(500).json({ message: err.message || 'Failed to reset password.' });
  }
});

// User Registration
app.post('/user/register', async (req, res) => {
  const { name, username, email, contactNumber, password } = req.body;
  if (!name || !username || !email || !contactNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      await connection.end();
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO users (name, username, email, contact_number, password) VALUES (?, ?, ?, ?, ?)',
      [name, username, email, contactNumber, hashedPassword]
    );
    const [userRows] = await connection.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    await connection.end();
    res.status(201).json({ message: 'User registered successfully', user: userRows[0] });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

// Admin Registration
app.post('/admin/register', async (req, res) => {
  const { username, email, contactNumber, password } = req.body;
  if (!username || !email || !contactNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [existing] = await connection.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      await connection.end();
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO admins (username, email, contact_number, password) VALUES (?, ?, ?, ?)',
      [username, email, contactNumber, hashedPassword]
    );
    const [adminRows] = await connection.execute('SELECT * FROM admins WHERE id = ?', [result.insertId]);
    await connection.end();
    res.status(201).json({ message: 'Admin registered successfully', admin: adminRows[0] });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Failed to register admin' });
  }
});

// --- Login Endpoints ---

// User Login
app.post('/user/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    await connection.end();
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    res.status(200).json({ 
      message: 'Login successful', 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        name: user.name,
        contact_number: user.contact_number 
      } 
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

// Admin Login
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [admins] = await connection.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ?',
      [username, username]
    );
    await connection.end();
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const admin = admins[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    res.status(200).json({ message: 'Login successful', admin: { id: admin.id, username: admin.username, email: admin.email } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const authenticate = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided. Please log in.' });
  }
  req.userId = userId;
  next();
};

// Post a new unit
app.post('/units', authenticate, async (req, res) => {
  const userId = req.userId;
  const { buildingName, unitNumber, location, specs, specialFeatures, unitPrice, contactPerson, phoneNumber, images } = req.body;
  if (!buildingName || !unitNumber || !specs) {
    return res.status(400).json({ message: 'Building Name, Unit Number, and Specifications are required' });
  }
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ message: 'At least one image is required.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO units (user_id, building_name, unit_number, location, specifications, special_features, unit_price, contact_person, phone_number, images, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [userId, buildingName, unitNumber, location, specs, specialFeatures, unitPrice, contactPerson, phoneNumber, JSON.stringify(images)]
    );
    await connection.end();
    res.status(201).json({ message: 'Unit posted successfully!' });
  } catch (error) {
    console.error('Error posting unit:', error);
    res.status(500).json({ message: 'Failed to post unit' });
  }
});

// Get all units for the logged-in user
app.get('/units', authenticate, async (req, res) => {
  const userId = req.userId;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [units] = await connection.execute(
      'SELECT * FROM units WHERE user_id = ?',
      [userId]
    );
    await connection.end();
    const processedUnits = units.map(unit => ({
      ...unit,
      images: safeParseImages(unit.images)
    }));
    res.status(200).json({ units: processedUnits });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ message: 'Failed to fetch units' });
  }
});

// Get a single unit for editing
app.get('/units/:id', authenticate, async (req, res) => {
  const unitId = req.params.id;
  const userId = req.userId;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [units] = await connection.execute(
      'SELECT * FROM units WHERE id = ? AND user_id = ?',
      [unitId, userId]
    );
    await connection.end();
    if (units.length === 0) {
      return res.status(404).json({ message: 'Unit not found or does not belong to this user' });
    }
    const unit = { 
      ...units[0], 
      images: safeParseImages(units[0].images)
    };
    res.status(200).json({ unit });
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ message: 'Failed to fetch unit details' });
  }
});

// Update a unit
app.put('/units/:id', authenticate, async (req, res) => {
  const unitId = req.params.id;
  const userId = req.userId;

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ message: 'Missing or invalid JSON payload.' });
  }

  const {
    buildingName,
    unitNumber,
    location,
    specs,
    specialFeatures,
    unitPrice,
    contactPerson,
    phoneNumber,
    images
  } = req.body;

  if (!buildingName || !unitNumber || !specs) {
    return res.status(400).json({
      message: 'Building Name, Unit Number, and Specifications are required'
    });
  }
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ message: 'At least one image is required.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [existingUnitRows] = await connection.execute(
      'SELECT id FROM units WHERE id = ? AND user_id = ?',
      [unitId, userId]
    );

    if (existingUnitRows.length === 0) {
      await connection.end();
      return res.status(404).json({
        message: 'Unit not found or does not belong to this user'
      });
    }

    await connection.execute(
      `UPDATE units 
       SET building_name = ?, unit_number = ?, location = ?, specifications = ?, special_features = ?, unit_price = ?, contact_person = ?, phone_number = ?, images = ? WHERE id = ? AND user_id = ?`,
      [
        buildingName,
        unitNumber,
        location,
        specs,
        specialFeatures,
        unitPrice,
        contactPerson,
        phoneNumber,
        JSON.stringify(images),
        unitId,
        userId
      ]
    );

    await connection.end();
    res.status(200).json({ message: 'Unit updated successfully' });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ message: 'Failed to update unit', error: error.message, stack: error.stack });
  }
});

// Delete a unit
app.delete('/units/:id', authenticate, async (req, res) => {
  const unitId = req.params.id;
  const userId = req.userId;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [unitToDeleteRows] = await connection.execute(
      'SELECT images FROM units WHERE id = ? AND user_id = ?',
      [unitId, userId]
    );
    if (unitToDeleteRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Unit not found or does not belong to this user' });
    }
    const imagePathsToDelete = safeParseImages(unitToDeleteRows[0].images);
    for (const imagePath of imagePathsToDelete) {
      const filePath = path.join(__dirname, imagePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error deleting image file ${filePath}:`, error);
      }
    }
    await connection.execute(
      'DELETE FROM units WHERE id = ? AND user_id = ?',
      [unitId, userId]
    );
    await connection.end();
    res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ message: 'Failed to delete unit' });
  }
});

// Public: Get all units (for UnitFinder)
app.get('/public/units', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [units] = await connection.execute('SELECT * FROM units');
    await connection.end();
    const mappedUnits = units.map(unit => ({
      ...unit,
      unitPrice: unit.unit_price,
      images: safeParseImages(unit.images),
      is_available: unit.is_available || 1
    }));
    res.status(200).json({ units: mappedUnits });
  } catch (error) {
    console.error('Error fetching all units for public view:', error);
    res.status(500).json({ message: 'Failed to fetch available units' });
  }
});

// Check if unit can be booked
app.get('/units/:id/booking-status', async (req, res) => {
  const unitId = req.params.id;
  const userId = req.headers['x-user-id'];
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get unit info
    const [units] = await connection.execute(
      'SELECT id, user_id, is_available FROM units WHERE id = ?',
      [unitId]
    );
    
    if (units.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    const unit = units[0];
    
    // Get user's existing bookings for this unit
    let userBookingStatus = null;
    if (userId && userId !== 'guest') {
      const [userBookings] = await connection.execute(
        'SELECT id, status FROM bookings WHERE unit_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
        [unitId, userId]
      );
      
      if (userBookings.length > 0) {
        userBookingStatus = {
          status: userBookings[0].status,
          bookingId: userBookings[0].id
        };
      }
    }
    
    // Check if unit has any confirmed booking
    const [confirmedBookings] = await connection.execute(
      'SELECT id FROM bookings WHERE unit_id = ? AND status = ?',
      [unitId, 'confirmed']
    );
    
    const isUnitConfirmed = confirmedBookings.length > 0;
    
    await connection.end();
    
    res.status(200).json({
      canBook: unit.is_available === 1 && !isUnitConfirmed,
      isAvailable: unit.is_available === 1,
      isConfirmed: isUnitConfirmed,
      userBookingStatus: userBookingStatus,
      message: isUnitConfirmed ? 
        'Unit is already booked and confirmed by another user' : 
        unit.is_available === 0 ? 'Unit is unavailable' : 'Unit can be booked'
    });
  } catch (error) {
    console.error('Error checking booking status:', error);
    res.status(500).json({ message: 'Failed to check booking status' });
  }
});

// --- Inquiries Endpoints ---
app.post('/inquiries', async (req, res) => {
  const { unitId, message } = req.body;
  const senderUserId = req.headers['x-user-id'];
  if (!unitId || !message || !senderUserId) {
    return res.status(400).json({ message: 'unitId, message, and sender user ID are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [unitRows] = await connection.execute('SELECT user_id FROM units WHERE id = ?', [unitId]);
    if (unitRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Unit not found' });
    }
    const recipientUserId = unitRows[0].user_id;
    if (parseInt(senderUserId) === recipientUserId) {
      await connection.end();
      return res.status(400).json({ message: 'Cannot send inquiry to yourself' });
    }
    await connection.execute(
      'INSERT INTO inquiries (unit_id, sender_user_id, recipient_user_id, message) VALUES (?, ?, ?, ?)',
      [unitId, senderUserId, recipientUserId, message]
    );
    await connection.end();
    res.status(201).json({ message: 'Inquiry sent successfully' });
  } catch (error) {
    console.error('Error sending inquiry:', error);
    res.status(500).json({ message: 'Failed to send inquiry' });
  }
});

app.post('/inquiries/reply', async (req, res) => {
  const { inquiryId, message, recipientUserId } = req.body;
  const senderUserId = req.headers['x-user-id'];
  if (!inquiryId || !message || !recipientUserId || !senderUserId) {
    return res.status(400).json({ message: 'inquiryId, message, recipientUserId, and sender user ID are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [inquiryRows] = await connection.execute('SELECT unit_id FROM inquiries WHERE id = ?', [inquiryId]);
    if (inquiryRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Original inquiry not found' });
    }
    const unitId = inquiryRows[0].unit_id;
    await connection.execute(
      'INSERT INTO inquiries (unit_id, sender_user_id, recipient_user_id, message, parent_inquiry_id) VALUES (?, ?, ?, ?, ?)',
      [unitId, senderUserId, recipientUserId, message, inquiryId]
    );
    await connection.end();
    res.status(201).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

app.get('/inquiries', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [inquiries] = await connection.execute(
      `SELECT 
        i.*, 
        u.building_name, 
        u.unit_number, 
        u.location,
        sender.name as sender_name,
        recipient.name as recipient_name
       FROM inquiries i
       JOIN units u ON i.unit_id = u.id
       LEFT JOIN users sender ON i.sender_user_id = sender.id
       LEFT JOIN users recipient ON i.recipient_user_id = recipient.id
       WHERE i.sender_user_id = ? OR i.recipient_user_id = ?
       ORDER BY i.created_at DESC`,
      [userId, userId]
    );

    for (const inquiry of inquiries) {
      const [replies] = await connection.execute(
        `SELECT 
          r.*,
          u.name as sender_name
         FROM inquiries r
         LEFT JOIN users u ON r.sender_user_id = u.id
         WHERE r.parent_inquiry_id = ? 
         ORDER BY r.created_at ASC`,
        [inquiry.id]
      );
      inquiry.replies = replies;
    }

    await connection.end();
    res.status(200).json({ inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries' });
  }
});

// --- Bookings Endpoints ---

// Create a new booking
app.post('/bookings', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { unitId, name, address, contactNumber, numberOfPeople, transaction, dateVisiting } = req.body;
  
  if (!userId || !unitId || !name || !address || !contactNumber || !numberOfPeople || !transaction || !dateVisiting) {
    return res.status(400).json({ message: 'All booking fields are required' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if unit exists and prevent booking own unit
    const [unitRows] = await connection.execute('SELECT * FROM units WHERE id = ?', [unitId]);
    if (unitRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    if (parseInt(unitRows[0].user_id) === parseInt(userId)) {
      await connection.end();
      return res.status(400).json({ message: 'You cannot book your own unit.' });
    }
    
    // Check if unit is already confirmed
    const [confirmedBookings] = await connection.execute(
      'SELECT * FROM bookings WHERE unit_id = ? AND status = ?',
      [unitId, 'confirmed']
    );
    
    if (confirmedBookings.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'This unit is already booked and confirmed. Unit is now unavailable.' });
    }
    
    // Check if user already has a pending or confirmed booking for this unit
    const [userExistingBookings] = await connection.execute(
      'SELECT * FROM bookings WHERE unit_id = ? AND user_id = ? AND status IN (?, ?)',
      [unitId, userId, 'pending', 'confirmed']
    );
    
    if (userExistingBookings.length > 0) {
      const existingStatus = userExistingBookings[0].status;
      if (existingStatus === 'pending') {
        await connection.end();
        return res.status(400).json({ message: 'You already have a pending booking for this unit.' });
      }
      if (existingStatus === 'confirmed') {
        await connection.end();
        return res.status(400).json({ message: 'You already have a confirmed booking for this unit.' });
      }
    }
    
    // Create new booking
    await connection.execute(
      'INSERT INTO bookings (unit_id, user_id, name, address, contact_number, number_of_people, transaction_type, date_of_visiting) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [unitId, userId, name, address, contactNumber, numberOfPeople, transaction, dateVisiting]
    );
    
    await connection.end();
    res.status(201).json({ message: 'Booking created successfully' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

// Get bookings made by the logged-in user
app.get('/bookings/my', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [bookings] = await connection.execute(
      `SELECT b.*, u.building_name, u.unit_number, u.location, u.is_available, 
       b.transaction_type, b.date_of_visiting 
       FROM bookings b 
       JOIN units u ON b.unit_id = u.id 
       WHERE b.user_id = ? 
       ORDER BY b.created_at DESC`,
      [userId]
    );
    await connection.end();
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get bookings for units posted by the logged-in user
app.get('/bookings/rented', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [bookings] = await connection.execute(
      `SELECT b.*, u.building_name, u.unit_number, u.location, u.is_available,
       b.transaction_type, b.date_of_visiting 
       FROM bookings b 
       JOIN units u ON b.unit_id = u.id 
       WHERE u.user_id = ? 
       ORDER BY b.created_at DESC`,
      [userId]
    );
    await connection.end();
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings for my units:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Cancel a pending booking (user can cancel their own pending booking)
app.delete('/bookings/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const bookingId = req.params.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if booking exists and belongs to user
    const [bookings] = await connection.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );
    
    if (bookings.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Booking not found or not authorized to cancel' });
    }
    
    const booking = bookings[0];
    
    // Only allow cancellation of pending bookings
    if (booking.status !== 'pending') {
      await connection.end();
      return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    }
    
    // Delete the booking
    await connection.execute(
      'DELETE FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );
    
    await connection.end();
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
});

// Confirm or deny a booking (unit owner only)
app.put('/bookings/:id/status', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const bookingId = req.params.id;
  const { status } = req.body; // 'confirmed', 'denied', or 'cancelled'
  
  if (!userId || !bookingId || !['confirmed', 'denied', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid request' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get booking with unit and user info
    const [rows] = await connection.execute(
      `SELECT b.*, u.user_id as unit_owner_id, u.id as unit_id, u.is_available 
       FROM bookings b 
       JOIN units u ON b.unit_id = u.id 
       WHERE b.id = ?`,
      [bookingId]
    );
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = rows[0];
    const unitId = booking.unit_id;
    const currentStatus = booking.status;
    
    // Handle different status updates
    if (status === 'cancelled') {
      // Only allow user to cancel their own pending booking
      if (parseInt(booking.user_id) !== parseInt(userId)) {
        await connection.end();
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }
      
      if (currentStatus !== 'pending') {
        await connection.end();
        return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
      }
      
      // Simply delete the booking
      await connection.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
      
    } else if (status === 'confirmed') {
      // Only unit owner can confirm
      if (parseInt(booking.unit_owner_id) !== parseInt(userId)) {
        await connection.end();
        return res.status(403).json({ message: 'Not authorized to confirm this booking' });
      }
      
      // Check if unit already has a confirmed booking
      const [confirmedBookings] = await connection.execute(
        'SELECT * FROM bookings WHERE unit_id = ? AND status = ? AND id != ?',
        [unitId, 'confirmed', bookingId]
      );
      
      if (confirmedBookings.length > 0) {
        await connection.end();
        return res.status(400).json({ message: 'This unit already has a confirmed booking.' });
      }
      
      // Update unit status to unavailable
      await connection.execute(
        'UPDATE units SET is_available = 0 WHERE id = ?',
        [unitId]
      );
      
      // Deny all other pending bookings for this unit
      await connection.execute(
        'UPDATE bookings SET status = ? WHERE unit_id = ? AND status = ? AND id != ?',
        ['denied', unitId, 'pending', bookingId]
      );
      
      // Update the booking status
      await connection.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
      
    } else if (status === 'denied') {
      // Only unit owner can deny
      if (parseInt(booking.unit_owner_id) !== parseInt(userId)) {
        await connection.end();
        return res.status(403).json({ message: 'Not authorized to deny this booking' });
      }
      
      // If denying a confirmed booking, make unit available again
      if (currentStatus === 'confirmed') {
        await connection.execute(
          'UPDATE units SET is_available = 1 WHERE id = ?',
          [unitId]
        );
      }
      
      // Update the booking status
      await connection.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
    }
    
    await connection.end();
    res.status(200).json({ message: `Booking ${status}` });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
});

// --- User Profile Endpoints ---
app.get('/user/profile', async (req, res) => {
  const userId = req.headers['x-user-id'];
  console.log('Fetching profile for user ID:', userId);
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      'SELECT id, name, username, email, contact_number, created_at FROM users WHERE id = ?', 
      [userId]
    );
    await connection.end();
    
    console.log('Found users:', users);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    res.status(200).json({ 
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        contactNumber: user.contact_number,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

app.put('/user/profile', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, email, contactNumber } = req.body;
  
  console.log('Updating profile for user ID:', userId, 'with data:', { name, email, contactNumber });
  
  if (!userId || !name || !email || !contactNumber) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if user exists
    const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Check if email is already taken by another user
    const [existingEmail] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    
    if (existingEmail.length > 0) {
      await connection.end();
      return res.status(409).json({ message: 'Email already in use by another account.' });
    }
    
    // Update user profile
    await connection.execute(
      'UPDATE users SET name = ?, email = ?, contact_number = ? WHERE id = ?',
      [name, email, contactNumber, userId]
    );
    
    // Get updated user data
    const [updatedUserRows] = await connection.execute(
      'SELECT id, name, username, email, contact_number, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    await connection.end();
    
    res.status(200).json({ 
      user: {
        id: updatedUserRows[0].id,
        name: updatedUserRows[0].name,
        username: updatedUserRows[0].username,
        email: updatedUserRows[0].email,
        contactNumber: updatedUserRows[0].contact_number,
        createdAt: updatedUserRows[0].created_at
      }, 
      message: 'Profile updated successfully.' 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// Change user password
app.put('/user/change-password', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { currentPassword, newPassword } = req.body;
  
  console.log('Changing password for user ID:', userId);
  
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get user with password
    const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const user = users[0];
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      await connection.end();
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    
    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    
    await connection.end();
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

// --- Admin User Management Endpoints ---
app.get('/admin/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM users');
    await connection.end();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Admin: Error fetching all users:', error);
    res.status(500).json({ message: 'Failed to fetch all users for admin' });
  }
});

app.delete('/admin/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [unitRows] = await connection.execute('SELECT id, images FROM units WHERE user_id = ?', [userId]);
    for (const unit of unitRows) {
      const imagePaths = safeParseImages(unit.images);
      for (const imagePath of imagePaths) {
        const filePath = path.join(__dirname, imagePath);
        try {
          await fs.unlink(filePath);
        } catch (error) {
        }
      }
    }
    await connection.execute('DELETE FROM units WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    await connection.end();
    res.status(200).json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    console.error('Admin: Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// --- Admin Unit Management Endpoints ---
app.get('/admin/units', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [units] = await connection.execute(
      `SELECT units.*, users.username as owner_username, users.email as owner_email FROM units LEFT JOIN users ON units.user_id = users.id`
    );
    await connection.end();
    const processedUnits = units.map(unit => ({
      ...unit,
      images: safeParseImages(unit.images)
    }));
    res.status(200).json({ units: processedUnits });
  } catch (error) {
    console.error('Admin: Error fetching all units:', error);
    res.status(500).json({ message: 'Failed to fetch all units for admin' });
  }
});

app.delete('/admin/units/:id', async (req, res) => {
  const unitId = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [unitRows] = await connection.execute('SELECT images FROM units WHERE id = ?', [unitId]);
    if (unitRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Unit not found' });
    }

    const imagePathsToDelete = safeParseImages(unitRows[0].images);
    for (const imagePath of imagePathsToDelete) {
      const filePath = path.join(__dirname, imagePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
      }
    }
    await connection.execute('DELETE FROM units WHERE id = ?', [unitId]);
    await connection.end();
    res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Admin: Error deleting unit', error);
    res.status(500).json({ message: 'Failed to delete unit' });
  }
});

// --- Admin Report Endpoints ---
app.get('/admin/report/statistics', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [usersResult] = await connection.execute('SELECT COUNT(*) as total_users FROM users');
    const totalUsers = usersResult[0].total_users;
    
    const [unitsResult] = await connection.execute('SELECT COUNT(*) as total_units FROM units');
    const totalUnits = unitsResult[0].total_units;
    
    const [bookingsResult] = await connection.execute('SELECT COUNT(*) as total_bookings FROM bookings');
    const totalBookings = bookingsResult[0].total_bookings;
    
    const [bookingStatusResult] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_bookings
       FROM bookings`
    );
    
    const [unitsStatusResult] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_units,
        SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as unavailable_units
       FROM units`
    );
    
    const [recentRegistrations] = await connection.execute(
      `SELECT COUNT(*) as recent_users 
       FROM users 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    
    const [recentUnits] = await connection.execute(
      `SELECT COUNT(*) as recent_units 
       FROM units 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    
    const [inquiriesResult] = await connection.execute('SELECT COUNT(*) as total_inquiries FROM inquiries');
    const totalInquiries = inquiriesResult[0].total_inquiries;
    
    const [topUsersResult] = await connection.execute(
      `SELECT u.username, u.email, COUNT(units.id) as units_count
       FROM users u
       LEFT JOIN units ON u.id = units.user_id
       GROUP BY u.id
       ORDER BY units_count DESC
       LIMIT 5`
    );
    
    const [transactionTypesResult] = await connection.execute(
      `SELECT 
        transaction_type,
        COUNT(*) as count
       FROM bookings
       WHERE transaction_type IS NOT NULL
       GROUP BY transaction_type`
    );
    
    await connection.end();
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers),
        totalUnits: parseInt(totalUnits),
        totalBookings: parseInt(totalBookings),
        totalInquiries: parseInt(totalInquiries),
        bookingStatus: {
          pending: parseInt(bookingStatusResult[0].pending_bookings),
          confirmed: parseInt(bookingStatusResult[0].confirmed_bookings),
          denied: parseInt(bookingStatusResult[0].denied_bookings)
        },
        unitStatus: {
          available: parseInt(unitsStatusResult[0].available_units),
          unavailable: parseInt(unitsStatusResult[0].unavailable_units)
        },
        recentActivity: {
          usersLast7Days: parseInt(recentRegistrations[0].recent_users),
          unitsLast7Days: parseInt(recentUnits[0].recent_units)
        },
        topUsers: topUsersResult,
        transactionTypes: transactionTypesResult
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin report statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch report statistics' 
    });
  }
});

app.get('/admin/report/bookings', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = `
      SELECT b.*, 
             u.building_name, u.unit_number, u.location,
             usr.username as renter_username, usr.email as renter_email,
             owner.username as owner_username, owner.email as owner_email
      FROM bookings b
      JOIN units u ON b.unit_id = u.id
      JOIN users usr ON b.user_id = usr.id
      JOIN users owner ON u.user_id = owner.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(b.created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(b.created_at) <= ?';
      params.push(endDate);
    }
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const connection = await mysql.createConnection(dbConfig);
    const [bookings] = await connection.execute(query, params);
    await connection.end();
    
    res.status(200).json({
      success: true,
      data: bookings
    });
    
  } catch (error) {
    console.error('Error fetching detailed bookings report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings report' 
    });
  }
});

app.get('/admin/report/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [users] = await connection.execute(
      `SELECT 
        u.*,
        COUNT(DISTINCT units.id) as units_posted,
        COUNT(DISTINCT b.id) as bookings_made,
        COUNT(DISTINCT i.id) as inquiries_sent,
        MAX(u.created_at) as last_activity
       FROM users u
       LEFT JOIN units ON u.id = units.user_id
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN inquiries i ON u.id = i.sender_user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    
    await connection.end();
    
    res.status(200).json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error('Error fetching users report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users report' 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});