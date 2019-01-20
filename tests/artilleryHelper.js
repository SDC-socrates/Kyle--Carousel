const generateRandomData = (userContext, events, done) => {
  userContext.vars.carId = Math.round(Math.random() * 1000) + 9999000;
  userContext.vars.long = Math.round(Math.random() * 170.1 - 85.05);
  userContext.vars.lat = Math.round(Math.random() * 360 - 180);
  userContext.vars.longSF = 35.2749;
  userContext.vars.latSF = 117.4194;
  userContext.vars.year = 2005 + Math.round(Math.random() * 9);
  userContext.vars.category = ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'sports', 'electric', 'muscle'][Math.round(Math.random() * 7)];
  return done();
};

module.exports = { generateRandomData };
