import { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Formatér dato til læsbart format
 * @param {Date} date
 * @returns {string} Formateret dato
 */
let formatDate = (date) => {
    return new Intl.DateTimeFormat('da-DK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
};

/**
 * @openapi
 * /message/new:
 *   post:
 *     summary: Opret en ny besked
 *     description: Admin-only endpoint til at sende beskeder.
 *     tags:
 *       - Message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender_id:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Hello"
 *               message:
 *                 type: string
 *                 example: "Hello World"
 *     responses:
 *       201:
 *         description: Besked oprettet
 *       400:
 *         description: Fejl i oprettelse
 */
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

/**
 * @openapi
 * /message/init:
 *   get:
 *     summary: Initialiser standard-beskeder
 *     description: Fylder databasen med standard-beskeder hvis tom.
 *     tags:
 *       - Message
 *     responses:
 *       200:
 *         description: Init succesfuld
 *       500:
 *         description: Serverfejl
 */
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

/**
 * @openapi
 * /message/get:
 *   get:
 *     summary: Hent alle beskeder
 *     description: Returnerer alle beskeder med forfatter og initialer.
 *     tags:
 *       - Message
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af beskeder
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   author:
 *                     type: string
 *                   authorInitials:
 *                     type: string
 *                   title:
 *                     type: string
 *                   message:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *       404:
 *         description: Ingen beskeder fundet
 */
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

export default router;
