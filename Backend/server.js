require("dotenv").config({
    path: __dirname + "/.env"
});

console.log("MONGODB_URI configured:", !!process.env.MONGODB_URI);
console.log("JWT_SECRET configured:", !!process.env.JWT_SECRET);
console.log("FRONTEND_ORIGIN configured:", !!process.env.FRONTEND_ORIGIN);

const express = require('express');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const encode = require("argon2");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.FRONTEND_ORIGIN) {
    throw new Error("MONGODB_URI, JWT_SECRET, and FRONTEND_ORIGIN must be configured");
}
if (isProduction && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
}
if (isProduction && (process.env.MONGODB_URI.includes("127.0.0.1") || process.env.MONGODB_URI.includes("localhost"))) {
    throw new Error("MONGODB_URI must point to a hosted database in production");
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Try again later.' }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('MongoDB Connected');
}).catch(err => console.error('MongoDB connection failed:', err));

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    Id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 5,
        maxlength: 5,
        match: [/^\d{2}[A-Za-z]\d{2}$/, 'ID must be 5 characters: first two digits, next a letter, last two digits']
    },
    psw: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 100
    }
});
const hai = mongoose.model('Student', studentSchema, 'HAi(2)');

app.post('/submit', authLimiter, async (req, res) => {
    try {
        const { name, Id, psw } = req.body;
        if (!name || !Id || !psw || typeof name !== 'string' || typeof Id !== 'string' || typeof psw !== 'string') {
            return res.status(400).json({ message: 'Name, ID, and password are required' });
        }
        const studentId = Id.trim();
        if (await hai.findOne({ Id: studentId })) {
            return res.status(400).json({ message: 'Student already exists' });
        }
        await new hai({ name: name.trim(), Id: studentId, psw: await encode.hash(psw) }).save();
        res.json({ message: 'Data Saved Successfully' });
    } catch (err) {
        console.error('POST /submit error:', err);
        res.status(500).json({ message: 'Error saving data' });
    }
});

app.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const student = await hai.findOne({ Id: username.trim() });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (!await encode.verify(student.psw, password)) return res.status(401).json({ message: 'Incorrect password' });

        const token = jwt.sign({ userId: student._id, Id: student.Id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 60 * 60 * 1000
        });
        res.json({ message: 'Login Successful' });
    } catch (err) {
        console.error('POST /login error:', err);
        res.status(500).json({ message: 'Error logging in' });
    }
});

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Please login" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(403).json({ message: "Invalid or expired token" });
    }
}

app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const student = await hai.findById(req.user.userId).select("-psw");
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) {
        console.error('GET /profile error:', err);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

app.patch('/profile', authenticateToken, async (req, res) => {
    try {
        const updates = {};
        if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
        if (typeof req.body.Id === 'string') updates.Id = req.body.Id.trim();
        if (typeof req.body.psw === 'string' && req.body.psw) updates.psw = await encode.hash(req.body.psw);
        const student = await hai.findByIdAndUpdate(req.user.userId, updates, {
            returnDocument: "after", runValidators: true
        }).select("-psw");
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Profile updated successfully', student });
    } catch (err) {
        console.error('PATCH /profile error:', err);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.delete("/profile", authenticateToken, async (req, res) => {
    try {
        await hai.deleteOne({ _id: req.user.userId });
        res.json({ message: "Profile deleted successfully" });
    } catch (error) {
        console.error("DELETE /profile error:", error);
        res.status(500).json({ message: "Delete failed" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
