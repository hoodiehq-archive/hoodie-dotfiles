'use strict';
var async = require('async');
var GithubApi = require('github');

var exports = module.exports = function(token, user) {
  var state = {
    github: new GithubApi({version: '3.0.0'}),
    token: token || process.env.GH_TOKEN,
    user: user || 'hoodiehq'
  };
  return {
    createLabels: exports.createLabels.bind(null, state)
  };
};

exports.createLabels = function(state, repos, labels) {
  async.each(repos, function(repo, doneRepo) {
    async.each(labels, function(label, doneLabel) {
      state.github.authenticate({
          type: 'oauth',
          token: state.token
      });
      state.github.issues.createLabel({
        name: label.name,
        color: label.color,
        user: state.user,
        repo: repo
      }, function(err, data) {
        if (err) {
          var reason = (JSON.parse(err.message).errors || [{code: 'no reason'}])[0].code;
          console.log(label.name +' NOT created for ' + state.user + '/' + repo + ', because ' + reason);
        } else {
          console.log(label.name +' created for ' + state.user + '/' + repo);
        }
        doneLabel();
      });
    }, function(err) {
      console.log('Labels have been applied to ' + state.user + '/' + repo);
      doneRepo();
    });
  }, function(err) {
    if (err) {
      console.log(err);
    }
    console.log('All labels have been applied to all repos.');
  });
};
