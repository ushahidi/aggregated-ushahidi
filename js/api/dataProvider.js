/**
 * Created by Вячеслав on 20.03.2015.
 */

var dataProvider = function () {
  this.arrayOfAuthors = [];
  this.allItems = [];
  this.viewed ={
    reports :0,
    deployments: 0
  }
  this.allItemIds = [];
}

/**
 *
 * @param method
 * @param data
 * @param callback
 */
dataProvider.prototype.getData = function (method, data, callback) {
  this[method](data, callback);
}

/**
 * Method return  count of reports in source
 *
 * @param data
 * @param callback
 */
dataProvider.prototype.getNumberOfReportsInSource = function(data, callback){
  $.ajax({
    url: 'http://api.crisis.net/item',
    data: {
      apikey: config.apiToken,
      sources: config.sources
    },
    success: function (responce) {
      callback(responce);
    }
  })
}

/**
 * Method return markers by params
 *
 * @param data
 * @param callback
 */
dataProvider.prototype.getAddressPoints = function (data, callback) {

  data.country
  var params = {
    apikey: config.apiToken,
    limit: data.limit,
    location: data.location,
    distance: data.distance,
    sources: config.sources
  };

  $.ajax({
    url: 'http://api.crisis.net/item',
    data: params,
    success: function (responce) {
      callback(responce);
    }
  })
}

/**
 * method set array of uniq authors id's
 *
 * @param authors
 */
dataProvider.prototype.setArrayOfAuthors = function (authors) {
  this.arrayOfAuthors = authors.filter(onlyUnique);
  return this.arrayOfAuthors;
}

/**
 * Method get uniq authors id's
 *
 * @returns {Array}
 */
dataProvider.prototype.getArrayOfAuthors = function () {
  return this.arrayOfAuthors;
}

/**
 *
 * @param type reports|deployments
 * @returns int
 */
dataProvider.prototype.getViewed = function(type){
  return this.viewed[type];
}

/**
 *
 * @param type reports|deployments
 * @param value int
 * @returns int
 */
dataProvider.prototype.setViewed = function(type, value){
  return this.viewed[type] = value;
}

/**
 * Method return true if item allrady exsists
 *
 * @param item object
 * @returns {boolean}
 */
dataProvider.prototype.isItemAllradyExist = function(item){
    return (item.id in this.allItemIds)
}

/**
 *
 * @param item object
 */
dataProvider.prototype.addItem = function(item){
  if (!(item.id in this.allItemIds)){
    this.allItemIds.push(item.id)
    this.allItems.push(item);
  }

  return item;
}

/**
 *
 * @returns {Array}
 */
dataProvider.prototype.getAllItems = function(){
  return this.allItems;
}

window.api = new dataProvider();


function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}