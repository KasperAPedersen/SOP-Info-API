import Express, { Router } from 'express';
import models from '../orm/models.js';

const router = Router();

router.use(Express.json());

router.get('/:id/get', async (req, res) => {
    const id = parseInt(req.params.id);
    const absence = await models.Absence.findByPk(id);
    if (!absence) {
        return res.status(404).json({ error: "Absence not found" });
    }
    res.json(absence);
});

router.post('/:id/set', async (req, res) => {
    const { type, message } = req.body;
    try {
        const id = parseInt(req.params.id);
        const absence = await models.Absence.findByPk(id);

        if (!absence) {
            return res.status(404).json({ error: "Absence not found" });
        }

        //add
        await models.Absence.create({
            userId: id,
            type: type,
            ....
        })
        res.json(absence);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;


