import {DataTypes} from 'sequelize';
import sequelize from '../database.js';

let Absence = sequelize.define('absence', {
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
        type: DataTypes.ENUM('awaiting', 'approved', 'denied'),
        defaultValue: 'awaiting'
    },
    message: {
        type: DataTypes.STRING,
    },
    type: {
        type: DataTypes.ENUM('sick', 'other')
    }
}, {
    tableName: 'absence',
    timestamps: true
});

Absence.associate = (models) => {
    Absence.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
};

export default Absence;
