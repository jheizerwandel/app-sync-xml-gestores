const Sequelize = require('sequelize');
const database = require('../db');

const uploadedFile = database.define('uploaded_file', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    path: {
        type: Sequelize.STRING(500),
        allowNull: false
    }
})

module.exports = uploadedFile;