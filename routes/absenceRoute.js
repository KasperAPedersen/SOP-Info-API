import Express, { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';

const router = Router();

router.use(Express.json());

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

router.post('/:id/new', async (req, res) => {
    const id = parseInt(req.params.id);
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


