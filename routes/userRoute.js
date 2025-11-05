import Express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

import models from '../orm/models.js';
import { requireAuth} from "../middleware/auth.js";

dotenv.config();

const router = Router();

router.use(Express.json());

router.get('/init', async (req, res) => {
    try {
        const users = await models.User.findAll();

        if(users.length > 0) return res.json({ success: true });

        await models.User.bulkCreate([
            { username: 'user1', password: await bcrypt.hash('pass1', 10), firstName: 'Johnny', lastName: 'Doe', consent: true },
            { username: 'user2', password: await bcrypt.hash('pass2', 10), firstName: 'Jane', lastName: 'Smith', consent: false }
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/authenticate', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await models.User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: "Couldnt find user" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION
        });

        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.json({
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get/username', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id, { attributes: ['username'] });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.type('text/plain').send(user.username);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get/name', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id, { attributes: ['firstName', 'lastName'] });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.type('text/plain').send(`${user.firstName} ${user.lastName}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get/consent', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id, { attributes: ['consent'] });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ consent: user.consent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/set/consent', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { consent } = req.body;

        if(id == null) return res.status(401).json(
            { error: "Id is null" }
        )

        const [updated] = await models.User.update({ consent }, { where: { id } });

        if (updated) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "User not found" updated: updated });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/set/password', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { password } = req.body;

        const [updated] = await models.User.update({ password }, { where: { id } });

        if (updated) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
