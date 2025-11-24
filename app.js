import Express from 'express';
import http from 'http';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import { setupSwagger } from "./swagger.js";
import { initWebSocket } from './socket.js';
import UserRoute from './routes/userRoute.js';
import MessageRoute from './routes/messageRoute.js';
import AbsenceRoute from './routes/absenceRoute.js';
import AdminRoute from './routes/adminRoute.js';
import QrRoute from './routes/qrRoute.js';

const app = Express();
setupSwagger(app);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);

        if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|app\.local)(:\d+)?$/)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(Express.json());
app.use(morgan("dev"));

app.use('/user', UserRoute);
app.use('/message', MessageRoute);
app.use('/absence', AbsenceRoute);
app.use('/admin', AdminRoute);
app.use('/attendance', QrRoute);

console.log('\n[INIT]\t\tInitializing');
const server = http.createServer(app);
initWebSocket(server);

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});
