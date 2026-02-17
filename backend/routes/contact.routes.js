const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const Contact = require('../models/contact.model');

// Get all contact messages (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        console.log('Fetched messages:', messages); // Debug log
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Error fetching contact messages' });
    }
});

// Create new contact message (public route)
router.post('/', async (req, res) => {
    try {
        console.log('Received contact form data:', req.body); // Debug log
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newMessage = new Contact({
            name,
            email,
            subject,
            message,
            status: 'unread'
        });

        const savedMessage = await newMessage.save();
        console.log('Saved message:', savedMessage); // Debug log
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error creating contact message:', error);
        res.status(500).json({ message: 'Error creating contact message' });
    }
});

// Update message status (admin only)
router.patch('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({ message: 'Error updating message status' });
    }
});

// Delete message (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const message = await Contact.findByIdAndDelete(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message' });
    }
});

module.exports = router; 