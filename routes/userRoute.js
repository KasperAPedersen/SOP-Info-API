import Express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import models from '../orm/models.js';

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

        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/:id/get', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

router.get('/:id/get/username', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

router.get('/:id/get/name', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

router.get('/:id/get/consent', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

router.post('/:id/set/consent', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { consent } = req.body;

        const [updated] = await models.User.update({ consent }, { where: { id } });

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

router.post('/:id/set/password', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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
