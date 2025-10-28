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
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Helper function to safely parse images ---
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

// User Registration
app.post('/user/register', async (req, res) => {
  const { name, username, email, contactNumber, password } = req.body;
  if (!name |!username || !email || !contactNumber || !password) {
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
    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
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

// Helper middleware to get userId from header
const authenticate = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided. Please log in.' });
  }
  req.userId = userId;
  next();
};

// Post a new unit
app.post('/units', authenticate, upload.array('images', 5), async (req, res) => {
  const userId = req.userId;
  const { buildingName, unitNumber, location, specs, specialFeatures, unitPrice, contactPerson, phoneNumber } = req.body;
  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
  if (!buildingName || !unitNumber || !specs) {
    return res.status(400).json({ message: 'Building Name, Unit Number, and Specifications are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO units (user_id, building_name, unit_number, location, specifications, special_features, unit_price, contact_person, phone_number, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, buildingName, unitNumber, location, specs, specialFeatures, unitPrice, contactPerson, phoneNumber, JSON.stringify(imagePaths)]
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
app.put('/units/:id', authenticate, upload.array('images', 10), async (req, res) => {
  const unitId = req.params.id;
  const userId = req.userId;
  const {
    buildingName, unitNumber, location, specs, specialFeatures, unitPrice, contactPerson, phoneNumber, existingImages
  } = req.body;

  const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
  const parsedExistingImages = safeParseImages(existingImages);
  const imagesToStore = parsedExistingImages.concat(newImagePaths);

  if (!buildingName || !unitNumber || !specs) {
    return res.status(400).json({
      message: 'Building Name, Unit Number, and Specifications are required'
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [existingUnitRows] = await connection.execute(
      'SELECT images FROM units WHERE id = ? AND user_id = ?',
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
        buildingName, unitNumber, location, specs, specialFeatures, unitPrice, contactPerson, phoneNumber, JSON.stringify(imagesToStore), unitId, userId
      ]
    );

    await connection.end();
    res.status(200).json({ message: 'Unit updated successfully' });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ message: 'Failed to update unit' });
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
      images: safeParseImages(unit.images)
    }));
    res.status(200).json({ units: mappedUnits });
  } catch (error) {
    console.error('Error fetching all units for public view:', error);
    res.status(500).json({ message: 'Failed to fetch available units' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// --- Inquiries Endpoints ---
// Send a new inquiry (bound to unit poster)
app.post('/inquiries', async (req, res) => {
  const { unitId, message } = req.body;
  const senderUserId = req.headers['x-user-id'];
  if (!unitId || !message || !senderUserId) {
    return res.status(400).json({ message: 'unitId, message, and sender user ID are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Get the poster (owner) of the unit
    const [unitRows] = await connection.execute('SELECT user_id FROM units WHERE id = ?', [unitId]);
    if (unitRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Unit not found' });
    }
    const recipientUserId = unitRows[0].user_id;
    // Prevent sending inquiry to self
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

// Reply to an inquiry (threaded)
app.post('/inquiries/reply', async (req, res) => {
  const { inquiryId, message, recipientUserId } = req.body;
  const senderUserId = req.headers['x-user-id'];
  if (!inquiryId || !message || !recipientUserId || !senderUserId) {
    return res.status(400).json({ message: 'inquiryId, message, recipientUserId, and sender user ID are required' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Get the original inquiry to fetch unit_id
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

// Fetch all inquiries for the logged-in user (sent or received, with unit info and user names)
app.get('/inquiries', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get all inquiries where user is sender or recipient with user names
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

    // For each inquiry, get replies with user names
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
  if (!userId || !unitId || !name || !address || !contactNumber || !numberOfPeople || !dateVisiting) {
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
    await connection.execute(
      'INSERT INTO bookings (unit_id, user_id, name, address, contact_number, number_of_people, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [unitId, userId, name, address, contactNumber, numberOfPeople, dateVisiting]
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
      `SELECT b.*, u.building_name, u.unit_number, u.location FROM bookings b JOIN units u ON b.unit_id = u.id WHERE b.user_id = ? ORDER BY b.created_at DESC`,
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
      `SELECT b.*, u.building_name, u.unit_number, u.location FROM bookings b JOIN units u ON b.unit_id = u.id WHERE u.user_id = ? ORDER BY b.created_at DESC`,
      [userId]
    );
    await connection.end();
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings for my units:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Confirm or deny a booking (unit owner only)
app.put('/bookings/:id/status', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const bookingId = req.params.id;
  const { status } = req.body; // 'confirmed' or 'denied'
  if (!userId || !bookingId || !['confirmed', 'denied'].includes(status)) {
    return res.status(400).json({ message: 'Invalid request' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Check if booking exists and belongs to a unit owned by this user
    const [rows] = await connection.execute(
      `SELECT b.*, u.user_id as unit_owner_id FROM bookings b JOIN units u ON b.unit_id = u.id WHERE b.id = ?`,
      [bookingId]
    );
        // date_of_visiting column
    await connection.execute(
      `INSERT INTO bookings (unit_id, user_id, name, address, contact_number, number_of_people, date_of_visiting, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [unitId, userId, name, address, contactNumber, numberOfPeople, date_of_visiting]
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (parseInt(rows[0].unit_owner_id) !== parseInt(userId)) {
      await connection.end();
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    await connection.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
    await connection.end();
    res.status(200).json({ message: `Booking ${status}` });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
});

// --- Admin User Management Endpoints ---

// Fetch all users (admin view)
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

// Admin delete any user (by id, cascade delete their data)
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
    // Delete all units for this user (which will cascade bookings/inquiries)
    await connection.execute('DELETE FROM units WHERE user_id = ?', [userId]);
    // Now delete the user
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    await connection.end();
    res.status(200).json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    console.error('Admin: Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// --- Admin Unit Management Endpoints ---

// Fetch all units (admin view, includes user info)
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

// Admin delete any unit (by id, regardless of owner)
app.delete('/admin/units/:id', async (req, res) => {
  const unitId = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Get images to delete
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