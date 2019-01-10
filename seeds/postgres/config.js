const Sequelize = require('sequelize');
const sequelize = new Sequelize('turash_c', 'postgres', '6042783128', {
  host: 'localhost',
  dialect: 'postgres',
  operatorsAliases: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
