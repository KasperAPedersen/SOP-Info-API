import Express, { Router } from 'express';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import crypto from 'crypto';

import { broadcast } from '../socket.js';


dotenv.config();

const router = Router();
router.use(Express.json());

export let checkInSecret = "secret";
export let prevCheckInSecret = "";
export let qrCodeDataURL = "";

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
