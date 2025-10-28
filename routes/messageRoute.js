import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json(messages);
});

router.get('/get/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const msg = messages.find(m => m.id === id);
    if (msg) return res.json(msg);
    res.status(404).json({ error: "Message not found" });
});

router.post('/', (req, res) => {
    const { sender, subject, body } = req.body || {};
    if (!sender || !subject || !body) {
        return res.status(400).json({ error: "sender, subject and body are required" });
    }
    const id = messages.length ? Math.max(...messages.map(m => m.id)) + 1 : 1;
    const msg = new Message(id, sender, "just now", subject, body);
    messages.push(msg);
    res.status(201).json(msg);
});

export default router;


