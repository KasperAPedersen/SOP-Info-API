import User from './models/user.js';
import Message from './models/message.js';
import Absence from './models/absence.js';

const models = {
    User,
    Message,
    Absence
};

// Initialize associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

export { User, Message, Absence };
export default models;