import User from './models/User.js';
import Message from './models/Message.js';
import Absence from './models/Absence.js';

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