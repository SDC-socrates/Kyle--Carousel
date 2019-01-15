// Purpose: Test alternate ways of seeding to Postgres so we don't need to use setTimeout

const Sequelize = require('sequelize');

const sequelize = new Sequelize('seedtrial', 'postgres', '6042783128', {
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
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

const Car = sequelize.define('car', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  lat: {
    type: Sequelize.FLOAT,
  },
  long: {
    type: Sequelize.FLOAT,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

// Current approach: Using sequelize bulk upload and promises

const bulkCreateCars = (n) => {
  var obj = [];
  for (var i = 0; i < n; i++) {
    obj.push({
      lat: Math.random()*100,
      long: Math.random()*100
    });
  }
  return obj;
};

Car.sync({ force: true })
  .then(() => Car.count())
  .then((countBefore) => {
    console.log('Count prior to bulk create:', countBefore);
    return Car.bulkCreate(bulkCreateCars(50000));
  })
  .then((result) => {
    console.log('Promise resolved: ', result);
    return Car.count();
  })
  .then((countAfter) => { console.log('Count after bulk create: ', countAfter); });
