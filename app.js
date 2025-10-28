import Express from 'express';
import morgan from 'morgan';

import UserRoute from './routes/userRoute.js';
import MessageRoute from './routes/messageRoute.js';

const app = Express();

app.use(Express.json());
app.use(morgan("dev"));

app.use('/user', UserRoute);
app.use('/message', MessageRoute);

app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000 on all interfaces')
});

