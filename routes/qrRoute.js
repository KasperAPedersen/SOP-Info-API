import Express, { Router } from 'express';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import crypto from 'crypto';
import models from '../orm/models.js';

import { broadcast } from '../socket.js';


dotenv.config();

const router = Router();
router.use(Express.json());

let checkInSecret = "secret";
let prevCheckInSecret = "";
let qrCodeDataURL = "";

router.get('/init', async (req, res) => {
    try {
        const users = await models.User.findAll();
        for(const user of users) {
            await models.Attendence.create({ userId: user.id });
        }

        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/reset', async (req, res) => {
    try {
        const all = await models.Attendence.findAll({});
        for(const attendence of all) {
            attendence.status = "not present";
            await attendence.save();

            broadcast('attendence', {
                id: attendence.id,
                userId: attendence.userId,
                status: attendence.status,
                username: (await models.User.findByPk(attendence.userId)).dataValues.username
            });
            console.log("reset");
        }

        await generateQrCode();
        broadcast('qr', {
            success: true,
            qrCode: qrCodeDataURL,
            content: checkInSecret
        });
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get', async (req, res) => {
    try {
        if(!qrCodeDataURL || !checkInSecret) {
            await generateQrCode();
        }

        res.json({
            success: true,
            qrCode: qrCodeDataURL,
            content: checkInSecret
        });
    } catch(e) {
        console.log(e);
        res.status(500).json({ error: "Server error: " + e.message });
    }
});

router.post('/new', async (req, res) => {
    try {
        const { userId, secret } = req.body;

        if(secret !== checkInSecret && secret !== prevCheckInSecret) {
            return res.status(401).json({ error: "Invalid secret" });
        }

        if(userId == null) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const findAttendence = await models.Attendence.findOne({ where: { userId: userId } });
        if(!findAttendence) {
            await models.Attendence.create({ userId: userId, status: "present" });
            return res.json({ success: true });
        }

        findAttendence.status = "present";
        await findAttendence.save();

        broadcast('attendence', {
            id: findAttendence.id,
            userId: findAttendence.userId,
            status: findAttendence.status,
            username: (await models.User.findByPk(findAttendence.userId)).dataValues.username
        });

        res.json({ success: true, content: "" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get/all/attendence', async (req, res) => {
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

let generateQrCode = async () => {
    try {
        prevCheckInSecret = checkInSecret;
        checkInSecret = crypto.randomBytes(32).toString('hex');
        qrCodeDataURL = await QRCode.toDataURL(checkInSecret);
    } catch(e) {
        console.error(e);
    }
};

setInterval(async () => {
    await generateQrCode();

    broadcast('qr', {
        success: true,
        qrCode: qrCodeDataURL,
        content: checkInSecret
    });
}, 5000);

export default router;
