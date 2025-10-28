import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: (msg) => {
        console.log(`[ORM]\t\t${msg}`);
    }
});

(async () => {
    try {
        await sequelize.authenticate(); // Test connectivity
        console.log('[CON]\t\tConnection has been established successfully.\n');
    } catch (e) {
        console.error('[CON]\t\tUnable to connect to the database:', e);
    }

    try {
        await sequelize.sync();
        console.log('[SYN]\t\tmodels has been synchronized.\n')
    } catch (e) {
        console.error('[SYN]\t\tUnable to synchronize models:', e);
    }
})();

export default sequelize;