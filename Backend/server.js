require("dotenv").config({
    path: __dirname + "/../.env"
});

console.log("JWT SECRET:", process.env.JWT_SECRET);

const express = require('express');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const encode = require("argon2");
const cors = require('cors');
const app = express();
app.use(cookieParser());
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/haiDB').then(() => {
    console.log('MongoDB Connected');
}).catch(err => console.log(err));

const studentSchema = new mongoose.Schema({
    name: String,
    Id: { type: String, unique: true },
    psw: String
});
const hai = mongoose.model('Student', studentSchema, 'HAi(2)');
app.post('/submit', async (req, res) => {
    try {
        req.body.psw= await encode.hash(req.body.psw);
        const existingStudent = await hai.findOne({ Id: req.body.Id });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student already exists' });
        }
        const student = new hai(req.body);
        await student.save();
        res.json({ message: 'Data Saved Successfully' });
    } catch (err) {
        console.error('POST /submit error:', err);
        res.status(500).json({ message: 'Error saving data' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const student = await hai.findOne({ Id: username });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
       const valid = await encode.verify(student.psw, password);
        if (!valid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
         const token = jwt.sign(
        {userId: student._id,Id: student.Id},
        process.env.JWT_SECRET,
        {expiresIn: "1h"}
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
        res.json({ message: 'Login Successful' });
    } catch (err) {
        console.error('POST /login error:', err);
        res.status(500).json({ message: 'Error logging in' });
    }
});

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    console.log("Token from cookies:", token);
    if (!token) {
        return res.status(401).json({
            message: "Please login"
        });
    }
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decoded;
        next();
    } catch (error) {
        console.log("JWT error:", error);
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
}

app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const student = await hai.findById(req.user.userId).select("-psw");
        console.log("Cookie:", req.cookies);
        console.log("Token:", req.cookies.token);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        console.error('GET /profile/:id error:', err);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});
app.patch('/profile', authenticateToken,async (req,res)=>{
    try{
        if (req.body.psw) {
            req.body.psw = await encode.hash(req.body.psw);
        }
        const student = await hai.findByIdAndUpdate(
            req.user.userId,
            req.body,
            { returnDocument: "after" }
        );
        if (!student) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            student: student
        });

    } catch (err) {
        console.error('PATCH /profile/:id error:', err);
        res.status(500).json({ message: 'Error updating profile' });
    }
});
app.delete("/profile", authenticateToken, async (req, res) => {
    try {
        console.log("req.user:", req.user);

        const result = await hai.deleteOne({
            Id: req.user.Id
        });

        console.log("Delete result:", result);

        res.json({
            message: "Profile deleted successfully"
        });

    } catch (error) {
        console.log("DELETE ERROR:", error);

        res.status(500).json({
            message: "Delete failed",
            error: error.message
        });
    }
});
app.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
});