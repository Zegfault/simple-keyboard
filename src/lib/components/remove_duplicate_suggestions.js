const _ = require('lodash')
const suggestionData = require('./suggestions_to_parse')
const fs = require('fs')

let formatted = {}

_.forEach(suggestionData, (val, key)=> {
  if (!_.get(formatted, key, false)) {
    _.set(formatted, key, val)
  }
})
const keys = _.sortBy(_.keys(formatted))

const finalFormat = {}
_.forEach(keys, (val) => {
  _.set(finalFormat, val, _.get(formatted, val, false))
});


fs.writeFileSync('./output.js', JSON.stringify(finalFormat))
