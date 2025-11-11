import Express, { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(Express.json());

router.get('/get/all', requireAdmin, async (req, res) => {
    try {
        const absences = await models.Absence.findAll({
            include: [{
                model: models.User,
                as: 'user',
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedAbsences = absences.map(absence => ({
            id: absence.id,
            user: absence.user?.username || 'Ukendt',
            userId: absence.userId,
            date: new Date(absence.createdAt).toLocaleDateString('da-DK'),
            reason: absence.message || 'Ingen besked',
            type: absence.type,
            status: absence.status
        }));

        res.json(formattedAbsences);
    } catch (error) {
        console.error('Absence fetch error:', error);
        res.status(500).json({ error: "Could not fetch absences" });
    }
});

router.post('/:id/set/status', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        const absence = await models.Absence.findByPk(id);
        if (!absence) {
            return res.status(404).json({ error: "Absence not found" });
        }

        absence.status = status;
        await absence.save();

        broadcast('absence', {
            id: absence.id,
            userId: absence.userId,
            status: absence.status,
            message: absence.message,
            type: absence.type,
            username: (await models.User.findByPk(absence.userId)).dataValues.username
        });

        res.status(200).json({ success: true });
    } catch(error) {
        res.status(400).json({ success: false });
    }
});

router.get('/get', requireAuth, async (req, res) => {
    const { id } = req.user;
    const absence = await models.Absence.findOne({
        where: { userId: id },
    });

    if (!absence) {
        return res.status(404).json({ error: "Absence not found" });
    }
    res.json(absence);
});

router.post('/new', requireAuth, async (req, res) => {
    const { id } = req.user;
    const { message,type } = req.body;
    try {
        await models.Absence.destroy({ where: { userId: id } });

        const newAbsence = await models.Absence.create({
            userId: id,
            type: type,
            message: message,
            status: 'afventer'
        });

        broadcast('absence', {
            id: newAbsence.id,
            userId: id,
            status: newAbsence.status,
            message: newAbsence.message,
            type: newAbsence.type,
            username: (await models.User.findByPk(id)).dataValues.username
        });

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false });
    }
});

export default router;


