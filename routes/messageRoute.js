import { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';
import {requireAdmin, requireAuth} from '../middleware/auth.js';


const router = Router();

router.post('/new', requireAdmin, async (req, res) => {
    const { sender_id, title, message } = req.body;
    try {
        const newMessage = await models.Message.create({
            sender_id: sender_id,
            title: title,
            message: message
        });


        let messageAuthor = await models.User.findByPk(sender_id);
        broadcast('message', {
            id: newMessage.id,
            author: messageAuthor.dataValues.firstName + " " + messageAuthor.dataValues.lastName,
            authorInitials: messageAuthor.dataValues.firstName[0] + messageAuthor.dataValues.lastName[0],
            title: newMessage.title,
            message: newMessage.message,
            timestamp: formatDate(newMessage.dataValues.createdAt)
        });

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false });
    }
});

router.get('/init', async (req, res) => {
    try {
        const message = await models.Message.findAll();

        if(message.length > 0) return res.json({ success: true });

        await models.Message.bulkCreate([
            { sender_id: 1, title: "Hello", message: "Hello World" },
            { sender_id: 1, title: "Hello", message: "Hello World" },
            { sender_id: 1, title: "Hello", message: "Hello World" },
            { sender_id: 1, title: "Hello", message: "Hello World" },
            { sender_id: 1, title: "Hello", message: "Hello World" },
            { sender_id: 1, title: "Hello", message: "Hello World" },
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get', requireAuth, async (req, res) => {
    const messages = await models.Message.findAll();
    if (!messages) {
        return res.status(404).json({ error: "Messages not found" });
    }

    for (const msg of messages) {
        msg.dataValues.timestamp = formatDate(msg.dataValues.createdAt);
        delete msg.dataValues.createdAt;
        delete msg.dataValues.updatedAt;

        let author = await models.User.findByPk(msg.dataValues.sender_id);
        msg.dataValues.author = author.dataValues.firstName + " " + author.dataValues.lastName;
        msg.dataValues.authorInitials = author.dataValues.firstName[0] + author.dataValues.lastName[0];

        delete msg.dataValues.sender_id;
    }

    res.json(messages);
});

let formatDate = (date) => {
    return new Intl.DateTimeFormat('da-DK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

export default router;


