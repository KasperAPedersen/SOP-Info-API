import Express from 'express';
import http from 'http';
import morgan from 'morgan';

import { initWebSocket } from './socket.js';
import UserRoute from './routes/userRoute.js';
import MessageRoute from './routes/messageRoute.js';
import AbsenceRoute from './routes/absenceRoute.js';

const app = Express();

app.use(Express.json());
app.use(morgan("dev"));

app.use('/user', UserRoute);
app.use('/message', MessageRoute);
app.use('/absence', AbsenceRoute);

const server = http.createServer(app);
initWebSocket(server);

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000 on all interfaces');
});