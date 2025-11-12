import Express, { Router } from 'express';
import dotenv from 'dotenv';
import models from '../orm/models.js';

dotenv.config();

const router = Router();

router.use(Express.json());

router.get('/init', async (req, res) => {
    try {
        // make an attendencne for each user
        const users = await models.User.findAll();
        for(const user of users) {
            await models.Attendence.create({ userId: user.id });
        }

        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
})

router.post('/new', async (req, res) => {
    try {
        const { userId } = req.body;

        if(userId == null) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const findAttendence = await models.Attendence.findOne({ where: { userId: userId } });
        if(!findAttendence) {
            console.log("No attendence found");
            await models.Attendence.create({ userId: userId, status: "present" });
            return res.json({ success: true });
        }

        findAttendence.status = "present";
        await findAttendence.save();

        console.log("Attendence updated");

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get', async (req, res) => {
    try {
        const attendences = await models.Attendence.findAll({
            include: [{
                model: models.User,
                as: 'user',
                attributes: ['username']
            }]
        });

        const formattedAttendences = attendences.map(attendence => ({
            id: attendence.id,
            user: attendence.user?.username || 'Ukendt',
            status: attendence.status
        }));

        res.status(200).json(formattedAttendences);
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
})

export default router;
