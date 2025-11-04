import Express, { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(Express.json());

router.post('/:id/set/status', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        const absence = await models.Absence.findOne({ where: { userId: id } });
        if (!absence) {
            return res.status(404).json({ error: "Absence not found" });
        }

        absence.status = status;
        await absence.save();

        broadcast('absence', {
            id: absence.id,
            userId: id,
            status: absence.status,
            message: absence.message,
            type: absence.type
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
            type: newAbsence.type
        });

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false });
    }
});

export default router;


