/**
 * Created by Вячеслав on 20.03.2015.
 */

var config = {
  apiToken: '550c48bc15f7e75a51090ec8',
  limit: 200,
  distance: 1500,
  sources: 'ushahidi_v2',
  markers: [
    {
      limit: 200,
      distance: 1500,
      location: '-110.44675319999999, 44.4995038'
    },
    {
      limit: 200,
      distance: 1500,
      location: '-81.94960270000001, 30.2603716'
    },
    {
      limit: 200,
      distance: 1500,
      location: '-74.07583299999999, 4.598056'
    },
    {
      limit: 200,
      distance: 1500,
      location: '-49.94554790000001, -11.8453756'
    }, {
      limit: 200,
      distance: 1500,
      location: '-64.53393690000001, -33.1443481'
    }, {
      limit: 200,
      distance: 1500,
      location: '18.674500299999977, 47.3065885'
    }, {
      limit: 200,
      distance: 1500,
      location: '2.0560241000000588, 15.6802177'
    }, {
      limit: 200,
      distance: 1500,
      location: '31.059930399999985, 3.7481129'
    }, {
      limit: 200,
      distance: 1500,
      location: '26.48961589999999, -24.313009'
    },
    {
      limit: 200,
      distance: 1500,
      location: '46.177117899999985, 25.6950491'
    }, {
      limit: 200,
      distance: 1500,
      location: '76.11328129999993, 26.273714'
    }, {
      limit: 200,
      distance: 1500,
      location: '112.88667770000006, 14.7782931'
    }, {
      limit: 200,
      distance: 1500,
      location: '130.7813625, 43.4261411'
    }, {
      limit: 200,
      distance: 1500,
      location: '161.40230270000006, -35.8861925'
    },

  ]
}


var argument = null;
var m = function (f) {
  if (is_null(argument)) {
    return argument = f();
  } else {
    return argument;
  }
}
