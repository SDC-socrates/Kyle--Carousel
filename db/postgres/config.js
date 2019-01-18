const Sequelize = require('sequelize');
const queries = require('./index');
const fs = require('fs');

let sequelizeLog = '';
const logToSequelizeLog = (executedQuery, executionTime) => {
  console.log(executedQuery);
  console.log(`Executed in: ${executionTime}ms.`);
  sequelizeLog += `${executionTime}\n`;
  fs.writeFileSync('./queryTimes.csv', sequelizeLog);
};

const sequelize = new Sequelize('turashc', 'postgres', '6042783128', {
  host: 'localhost',
  dialect: 'postgres',
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 120000,
    idle: 100000
  },
  benchmark: true,
  logging: logToSequelizeLog
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
