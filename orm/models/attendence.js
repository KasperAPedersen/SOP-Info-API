import {DataTypes} from 'sequelize';
import sequelize from '../database.js';

let Attendence = sequelize.define('attendence', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('present', 'not present'),
        defaultValue: 'not present'
    }
}, {
    tableName: 'attendence',
    timestamps: true
});

Attendence.associate = (models) => {
    Attendence.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
};

export default Attendence;
