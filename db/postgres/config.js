const Sequelize = require('sequelize');
const fs = require('fs');
const env = require('../../.env');

let sequelizeLog = '';
const logToSequelizeLog = (executedQuery, executionTime) => {
  // console.log(executedQuery);
  // console.log(`DB execution time: ${executionTime}ms.`);
  // sequelizeLog += `${executionTime}\n`;
  // fs.writeFileSync('./queryTimes.csv', sequelizeLog);
};

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPass, {
  host: env.dbHost,
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
