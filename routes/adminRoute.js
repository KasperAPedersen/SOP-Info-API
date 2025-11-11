import Express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

import models from '../orm/models.js';

dotenv.config();

const router = Router();

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

        if(!user.dataValues.admin) {
            return res.status(401).json({ error: "Insufficient permissions" });
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

export default router;
