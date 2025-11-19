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
            await models.Attendance.create({ userId: user.id });
        }

        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/reset/qr', async (req, res) => {
    try {
        const all = await models.Attendance.findAll({});
        for(const attendance of all) {
            attendance.status = "not present";
            await attendance.save();

            broadcast('attendance', {
                id: attendance.id,
                userId: attendance.userId,
                status: attendance.status,
                username: (await models.User.findByPk(attendance.userId)).dataValues.username
            });
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

router.get('/get/qr', async (req, res) => {
    try {
        if(!qrCodeDataURL || !checkInSecret) {
            await generateQrCode();
        }

        res.status(200).json({
            success: true,
            qrCode: qrCodeDataURL,
            content: checkInSecret
        });
    } catch(e) {
        console.log(e);
        res.status(500).json({ error: "Server error: " + e.message });
    }
});

router.get('/refresh/qr', async (req, res) => {
   try {
       await generateQrCode();

       res.status(200).json({
           success: true,
           qrCode: qrCodeDataURL,
           content: checkInSecret
       });
   }  catch(e) {
       console.error(e);
       res.status(500).json({ error: "Server error" });
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

        const findAttendance = await models.Attendance.findOne({ where: { userId: userId } });
        if(!findAttendance) {
            await models.Attendance.create({ userId: userId, status: "present" });
            return res.json({ success: true });
        }

        findAttendance.status = "present";
        await findAttendance.save();

        broadcast('attendance', {
            id: findAttendance.id,
            userId: findAttendance.userId,
            status: findAttendance.status,
            username: (await models.User.findByPk(findAttendance.userId)).dataValues.username
        });

        res.json({ success: true, content: "" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get/all', async (req, res) => {
    try {
        const attendances = await models.Attendance.findAll({
            include: [{
                model: models.User,
                as: 'user',
                attributes: ['username']
            }]
        });

        const formattedAttendances = attendances.map(attendance => ({
            id: attendance.id,
            user: attendance.user?.username || 'Ukendt',
            status: attendance.status
        }));

        res.status(200).json(formattedAttendances);
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get', async (req, res) => {
    try {
        const { userId } = req.body;
        const attendance = await models.Attendance.findOne({ where: { userId: userId } });

        if(!attendance) {
            return res.status(404).json({ error: "Attendance not found" });
        }

        res.status(200).json({
            status: attendance.status
        });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
})

let generateQrCode = async () => {
    try {
        prevCheckInSecret = checkInSecret;
        checkInSecret = crypto.randomBytes(32).toString('hex');
        qrCodeDataURL = await QRCode.toDataURL(checkInSecret, {
            width: 230,
            margin: 0
        });
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
}, 2500);

export default router;
