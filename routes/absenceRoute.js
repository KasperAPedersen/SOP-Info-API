import Express, { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';

const router = Router();

router.use(Express.json());

router.post('/:id/set/status', async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    try {
        // limit 1
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

router.get('/:id/get', async (req, res) => {
    const id = parseInt(req.params.id);
    const absence = await models.Absence.findOne({
        where: { userId: id },
    });

    if (!absence) {
        return res.status(404).json({ error: "Absence not found" });
    }
    res.json(absence);
});

router.post('/new', async (req, res) => {
    const { id, message,type } = req.body;
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


