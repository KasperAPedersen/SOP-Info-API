import Express, { Router } from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createCanvas } from 'canvas';
import { QRCodeStyling } from 'qr-code-styling-node';
import models from '../orm/models.js';
import { broadcast } from '../socket.js';

dotenv.config();

const router = Router();
router.use(Express.json());

let checkInSecret = "secret";
let prevCheckInSecret = "";
let qrCodeDataURL = "";

// Initialize QRCodeStyling instance
const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    margin: 10,
    type: "png",
    data: checkInSecret,
    dotsOptions: {
        color: "#4ade80", // green dots
        type: "rounded"   // round dots
    },
    cornersSquareOptions: {
        type: "extra-rounded",
        color: "#16a34a"  // green eyes
    },
    cornersDotOptions: {
        type: "dot",
        color: "#16a34a"
    },
    backgroundOptions: {
        color: "#1e293b" // dark background
    }
});

// Generate new QR code
const generateQrCode = async () => {
    try {
        prevCheckInSecret = checkInSecret;
        checkInSecret = crypto.randomBytes(16).toString('hex'); // shorter secret for better QR

        qrCode.update({ data: checkInSecret });

        const canvas = createCanvas(300, 300);
        await qrCode.draw(canvas);
        qrCodeDataURL = canvas.toDataURL();
    } catch (e) {
        console.error("QR generation error:", e);
    }
};

// Initialize attendance
router.get('/init', async (req, res) => {
    try {
        const users = await models.User.findAll();
        for (const user of users) {
            await models.Attendence.create({ userId: user.id });
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// Reset attendance
router.get('/reset', async (req, res) => {
    try {
        const all = await models.Attendence.findAll();
        for (const attendence of all) {
            attendence.status = "not present";
            await attendence.save();

            broadcast('attendence', {
                id: attendence.id,
                userId: attendence.userId,
                status: attendence.status,
                username: (await models.User.findByPk(attendence.userId)).dataValues.username
            });
        }

        await generateQrCode();

        broadcast('qr', {
            success: true,
            qrCode: qrCodeDataURL,
            content: checkInSecret
        });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// Get current QR code
router.get('/get', async (req, res) => {
    try {
        if (!qrCodeDataURL || !checkInSecret) {
            await generateQrCode();
        }

        res.status(200).json({
            success: true,
            qrCode: qrCodeDataURL,
            content: checkInSecret
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error: " + e.message });
    }
});

// Refresh QR code
router.get('/refresh', async (req, res) => {
    try {
        await generateQrCode();
        res.status(200).json({
            success: true,
            qrCode: qrCodeDataURL,
            content: checkInSecret
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// New attendance entry
router.post('/new', async (req, res) => {
    try {
        const { userId, secret } = req.body;

        if (secret !== checkInSecret && secret !== prevCheckInSecret) {
            return res.status(401).json({ error: "Invalid secret" });
        }

        if (userId == null) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const findAttendence = await models.Attendence.findOne({ where: { userId } });
        if (!findAttendence) {
            await models.Attendence.create({ userId, status: "present" });
        } else {
            findAttendence.status = "present";
            await findAttendence.save();
        }

        broadcast('attendence', {
            id: findAttendence?.id || null,
            userId,
            status: "present",
            username: (await models.User.findByPk(userId))?.dataValues.username || "Ukendt"
        });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all attendances
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
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// Live QR code broadcast every 100ms
setInterval(async () => {
    await generateQrCode();

    broadcast('qr', {
        success: true,
        qrCode: qrCodeDataURL,
        content: checkInSecret
    });
}, 100);

export default router;
