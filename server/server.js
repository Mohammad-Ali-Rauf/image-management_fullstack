import express from 'express';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from './models/users/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
config()

// Initialize an express server
const app = express();

app.use(express.json())

// Connect Database
try {
    mongoose.connect(process.env.DATABASE_URI)
    console.log('Connected to MongoDB Successfully!!')
} catch (err) {
    console.error('Error: ', err)
}

// App Root
app.get('/', (req, res) => {
    res.json({ msg: 'Server is working perfectly!!' })
})

// Define Routes

// Register user on database
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, createdAt } = req.body;

        const existingUser = await User.findOne({ email: email })

        if(existingUser) {
            return res.status(401).json({ msg: 'User already exists.' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            createdAt: createdAt
        })
        await newUser.save()

        const token = jwt.sign({ userId: newUser._id, name: newUser.name, email: newUser.email, password: newUser.password }, process.env.JWT_SECRET);

        return res.status(201).json({ msg: 'User registered successfully!', newUser, token: token })
        
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Log in user
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email })

        if(!user) {
            return res.status(401).json({ msg: 'User not found!' })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if(!isPasswordValid) {
            return res.status(401).json({ msg: 'Password is incorrect!' })
        }

        const token = jwt.sign({ userId: user._id, email: user.email, password: user.password }, process.env.JWT_SECRET);

        return res.status(201).json({ msg: 'User logged in successfully!', user, token: token })
        
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Define PORT
const PORT = 5000 || process.env.PORT;

// Listen server on port 5000
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))