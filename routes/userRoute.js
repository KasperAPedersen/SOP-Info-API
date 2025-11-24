import Express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import models from '../orm/models.js';
import { requireAuth } from "../middleware/auth.js";

dotenv.config();
const router = Router();
router.use(Express.json());

/**
 * @openapi
 * /user/init:
 *   get:
 *     summary: Initialiser brugere
 *     description: Opretter standardbrugere hvis databasen er tom
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Init succesfuld
 *       500:
 *         description: Serverfejl
 */
router.get('/init', async (req, res) => {
    try {
        const users = await models.User.findAll();
        if(users.length > 0) return res.json({ success: true });

        await models.User.bulkCreate([
            { username: 'user1', password: await bcrypt.hash('pass1', 10), firstName: 'Johnny', lastName: 'Doe', consent: true, admin: true },
            { username: 'user2', password: await bcrypt.hash('pass2', 10), firstName: 'Jane', lastName: 'Smith', consent: false }
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/new:
 *   post:
 *     summary: Opret ny bruger
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bruger oprettet
 *       400:
 *         description: Manglende felter eller fejl
 */
router.post('/new', async (req, res) => {
    const { username, password, firstName, lastName } = req.body;
    try {
        if(username == null || password == null || firstName == null || lastName == null) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await models.User.create({ username, password: hashedPassword, firstName, lastName });
        await models.Attendance.create({ userId: newUser.id });

        res.status(201).json({ id: newUser.id });
    } catch(e) {
        console.error(e);
        res.status(400).json({ error: "Couldn't create user" });
    }
});

/**
 * @openapi
 * /user/authenticate:
 *   post:
 *     summary: Log ind
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login succesfuld, returnerer token og brugerdata
 *       401:
 *         description: Forkert username eller password
 *       500:
 *         description: Serverfejl
 */
router.post('/authenticate', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await models.User.findOne({ where: { username } });
        if (!user) return res.status(401).json({ error: "Couldnt find user" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION
        });

        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/get:
 *   get:
 *     summary: Hent brugerinfo
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brugerinfo
 *       404:
 *         description: Bruger ikke fundet
 *       500:
 *         description: Serverfejl
 */
router.get('/get', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/get/username:
 *   get:
 *     summary: Hent kun username
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returnerer username som tekst
 *       404:
 *         description: Bruger ikke fundet
 */
router.get('/get/username', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id, { attributes: ['username'] });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.type('text/plain').send(user.username);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/get/name:
 *   get:
 *     summary: Hent fornavn + efternavn
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returnerer fulde navn som tekst
 *       404:
 *         description: Bruger ikke fundet
 */
router.get('/get/name', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id, { attributes: ['firstName', 'lastName'] });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.type('text/plain').send(`${user.firstName} ${user.lastName}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/get/consent:
 *   get:
 *     summary: Hent samtykke
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returnerer samtykke
 *       404:
 *         description: Bruger ikke fundet
 */
router.get('/get/consent', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const user = await models.User.findByPk(id, { attributes: ['consent'] });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ consent: user.consent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/set/consent:
 *   post:
 *     summary: Opdater samtykke
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consent:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Samtykke opdateret
 *       404:
 *         description: Bruger ikke fundet
 */
router.post('/set/consent', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { consent } = req.body;

        const [updated] = await models.User.update({ consent }, { where: { id } });
        if (updated) res.json({ success: true });
        else res.status(404).json({ error: "User not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/set/firstLogin:
 *   post:
 *     summary: Opdater firstLogin flag
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFirst:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Flag opdateret
 *       404:
 *         description: Bruger ikke fundet
 */
router.post('/set/firstLogin', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { isFirst } = req.body;

        const [updated] = await models.User.update({ firstLogin: isFirst }, { where: { id } });
        if (updated) res.json({ success: true });
        else res.status(404).json({ error: "User not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @openapi
 * /user/set/password:
 *   post:
 *     summary: Opdater password
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password opdateret
 *       404:
 *         description: Bruger ikke fundet
 */
router.post('/set/password', requireAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const [updated] = await models.User.update({ password: hashedPassword }, { where: { id } });

        if (updated) res.json({ success: true });
        else res.status(404).json({ error: "User not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
