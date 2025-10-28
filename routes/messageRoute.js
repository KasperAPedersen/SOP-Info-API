import { Router } from 'express';
import models from '../orm/models.js';

const router = Router();

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

router.get('/get', async (req, res) => {
    const messages = await models.Message.findAll();
    res.json(messages);
});

router.get('/:id/get', async (req, res) => {
    const id = parseInt(req.params.id);
    const msg = await models.Message.findByPk(id);
    if (!msg) {
        return res.status(404).json({ error: "Message not found" });
    }
    res.json(msg);
});

export default router;


