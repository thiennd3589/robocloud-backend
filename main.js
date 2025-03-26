// Copyright h2flatform - vntopmas@gmail.com. 2019,2020. All Rights Reserved.
// Node module: h2flatform

const application = require('./dist');

module.exports = application;

if (require.main === module) {
  // Run the application
  application.main().catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
