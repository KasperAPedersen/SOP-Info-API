import { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';


const router = Router();

router.post('/new', async (req, res) => {
    const { sender_id, title, message } = req.body;
    try {
        const newMessage = await models.Message.create({
            sender_id: sender_id,
            title: title,
            message: message
        });

        broadcast('message', {
            id: newMessage.id,
            author: sender_id,       // or newMessage.sender.name if you have associations
            title: newMessage.title,
            message: newMessage.message,
            timestamp: newMessage.createdAt // or newMessage.updatedAt
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

router.get('/get', async (req, res) => {
    const messages = await models.Message.findAll();
    if (!messages) {
        return res.status(404).json({ error: "Messages not found" });
    }

    for (const msg of messages) {
        msg.dataValues.timestamp = msg.dataValues.createdAt.toLocaleString();
        delete msg.dataValues.createdAt;
        delete msg.dataValues.updatedAt;

        let author = await models.User.findByPk(msg.dataValues.sender_id);
        msg.dataValues.author = author.dataValues.username;

        delete msg.dataValues.sender_id;
    }

    res.json(messages);
});

router.get('/:id/get', async (req, res) => {
    const id = parseInt(req.params.id);
    const msg = await models.Message.findByPk(id);
    if (!msg) {
        return res.status(404).json({ error: "Message not found" });
    }

    msg.dataValues.timestamp = msg.dataValues.createdAt.toLocaleString();
    delete msg.dataValues.createdAt;
    delete msg.dataValues.updatedAt;

    let author = await models.User.findByPk(msg.dataValues.sender_id);
    msg.dataValues.author = author.dataValues.username;

    delete msg.dataValues.sender_id;

    res.json(msg);
});

router.get('/get/latest', async (req, res) => {
    try {
        const messages = await models.Message.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5,
        });

        for (const msg of messages) {
            msg.dataValues.timestamp = msg.dataValues.createdAt.toLocaleString();
            delete msg.dataValues.createdAt;
            delete msg.dataValues.updatedAt;

            let author = await models.User.findByPk(msg.dataValues.sender_id);
            msg.dataValues.author = author.dataValues.username;

            delete msg.dataValues.sender_id;
        }

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;


