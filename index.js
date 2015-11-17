'use strict'
var async = require('async')
var _ = require('lodash')
var GithubApi = require('github')

var exports = module.exports = function (token, user) {
  var state = {
    github: new GithubApi({version: '3.0.0'}),
    token: token || process.env.GH_TOKEN,
    user: user || 'hoodiehq'
  }
  return {
    createLabels: exports.createLabels.bind(null, state),
    purgeLabels: exports.purgeLabels.bind(null, state)
  }
}

exports.createLabels = function (state, repos, labels) {
  async.each(repos, function (repo, doneRepo) {
    async.each(labels, function (label, doneLabel) {
      state.github.authenticate({
        type: 'oauth',
        token: state.token
      })
      state.github.issues.createLabel({
        name: label.name,
        color: label.color,
        user: state.user,
        repo: repo
      }, function (err, data) {
        if (err) {
          var reason = (JSON.parse(err.message).errors || [{code: 'no reason'}])[0].code
          console.log(label.name + ' NOT created for ' + state.user + '/' + repo + ', because ' + reason)
        } else {
          console.log(label.name + ' created for ' + state.user + '/' + repo)
        }
        doneLabel()
      })
    }, function (err) {
      if (err) {
        return console.error(err)
      }
      console.log('Labels have been applied to ' + state.user + '/' + repo)
      doneRepo()
    })
  }, function (err) {
    if (err) {
      console.log(err)
    }
    console.log('All labels have been applied to all repos.')
  })
}

exports.purgeLabels = function (state, repos, newLabels) {
  state.github.authenticate({
    type: 'oauth',
    token: state.token
  })
  async.each(repos, function (repo, doneRepo) {
    state.github.issues.getLabels({
      user: state.user,
      repo: repo
    }, function (error, existingLabels) {
      if (error) {
        return console.error(error)
      }
      var labelNamesToRemove = _.without.apply(null, [existingLabels.map(toName)].concat(newLabels.map(toName)))
      async.each(labelNamesToRemove, function (labelName, doneDelete) {
        console.log('deleting obsolete label %s from %s', labelName, repo)
        state.github.issues.deleteLabel({
          user: state.user,
          repo: repo,
          name: labelName
        }, doneDelete)
      }, function (error) {
        if (error) {
          return console.error(error)
        }

        async.each(newLabels, function (label, doneLabel) {
          state.github.issues.createLabel({
            name: label.name,
            color: label.color,
            user: state.user,
            repo: repo
          }, function (err, data) {
            if (err) {
              var reason = (JSON.parse(err.message).errors || [{code: 'no reason'}])[0].code
              console.log(label.name + ' NOT created for ' + state.user + '/' + repo + ', because ' + reason)
            } else {
              console.log(label.name + ' created for ' + state.user + '/' + repo)
            }
            doneLabel()
          })
        }, function () {
          if (error) {
            return console.error(error)
          }

          doneRepo()
        })
      })
    })
  }, function (err) {
    if (err) {
      console.log(err)
    }
    console.log('All labels have been applied to all repos.')
  })
}

// {url, name, color} =>
function toLabelConfig(githubLabelJson) {
  delete githubLabelJson.url
  return githubLabelJson
}

function toName(label) {
  return label.name
}
