import Express, { Router } from 'express';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(Express.json());

/**
 * @openapi
 * /absence/get/all:
 *   get:
 *     summary: Hent alle fraværsindberetninger
 *     description: Admin-only endpoint. Returnerer alle registrerede fravær.
 *     tags:
 *       - Absence
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af fravær
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Absence'
 *       401:
 *         description: Ikke autoriseret (admin kræves)
 *       500:
 *         description: Serverfejl
 */
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

/**
 * @openapi
 * /absence/{id}/set/status:
 *   post:
 *     summary: Opdater status på en fraværsindberetning
 *     tags:
 *       - Absence
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID på fravær
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [awaiting, approved, denied]
 *     responses:
 *       200:
 *         description: Status opdateret
 *       400:
 *         description: Forkert input
 *       404:
 *         description: Fravær ikke fundet
 */
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
            broadcastType: "absence",
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

/**
 * @openapi
 * /absence/get:
 *   get:
 *     summary: Hent dit eget fravær
 *     tags:
 *       - Absence
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dit fravær
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Absence'
 *       404:
 *         description: Intet fravær fundet
 */
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

/**
 * @openapi
 * /absence/new:
 *   post:
 *     summary: Opret et nyt fravær
 *     description: Overwrites existing absence for the user.
 *     tags:
 *       - Absence
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [sick, other]
 *     responses:
 *       201:
 *         description: Fravær oprettet
 *       400:
 *         description: Fejl i oprettelse
 */
router.post('/new', requireAuth, async (req, res) => {
    const { id } = req.user;
    const { message, type } = req.body;
    try {
        await models.Absence.destroy({ where: { userId: id } });

        const newAbsence = await models.Absence.create({
            userId: id,
            type: type,
            message: message,
            status: 'awaiting'
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
