import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false
});

(async () => {
    console.log('\n[INIT]\t\tInitializing...');
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (e) {
        console.error('Unable to connect to the database:', e);
    }

    try {
        await sequelize.sync();
        console.log('Models has been synchronized.')
    } catch (e) {
        console.error('Unable to synchronize models:', e);
    }
    console.log('\n[LOG]\t\tReceived requests');
})();

export default sequelize;