import Express, { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.use(Express.json());

router.get('/test', async (req, res) => {
    try {
        console.log(req.body)

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
