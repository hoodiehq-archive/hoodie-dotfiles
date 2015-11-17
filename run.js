var labels = require('./index.js')(process.env.GH_TOKEN);
labels.purgeLabels(require('./repos.json'), require('./labels.json'));
