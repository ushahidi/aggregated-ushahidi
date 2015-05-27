$(function () {

  var searchAreas = config.markers;
  var apiCallCount = 0;

  var countryName = location.href.substring(location.href.lastIndexOf('/#')+1, location.href.length);
  countryName = countryName.replace('#','');
  searchAreas.map(function (searchArea) {
    api.getData('getAddressPoints', searchArea, addMarkerToMaps)
  })

  api.getData('getNumberOfReportsInSource', {}, function(responce){
    $('.number-of-reports-in-source').text(responce.total);
  })

  $('input, textarea').placeholder();

  var startLocation = {
    lat: 0,
    lng: 0,
    zoom: 2
  };

  if (countryName) {
    var countrInfo = countries[countryName.toLowerCase()];

    if (countrInfo) {
      startLocation.zoom = countrInfo.zoom;
      startLocation.lat = countrInfo.latitude;
      startLocation.lng = countrInfo.longitude;
    }
  }


  var map = L.map('map').setView([startLocation.lat, startLocation.lng], startLocation.zoom);

  map.on('zoomend', reCalculateReportsAndDeployments);

  map.on('moveend', reCalculateReportsAndDeployments);

  var zoom = 0;

  L.tileLayer.grayscale('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    minZoom: 2,
    maxZoom: 24
  }).addTo(map);

  var markers = L.markerClusterGroup({
    chunkedLoading: true,
    singleMarkerMode: true,
    maxClusterRadius: 60,
    polygonOptions: {
      fillColor: '#3887be',
      color: '#3887be',
      weight: 2,
      opacity: 0,
      fillOpacity: 0
    },
    iconCreateFunction: function (cluster) {
      var clusterSize = "small";
      var x = y = 30;

      if (cluster.getChildCount() > 1) {
        clusterSize = "medium";
        x = y = 54;
      }
      return new L.DivIcon({
        html: '<div><span>' + cluster.getChildCount() + '</span></div>',
        className: 'marker-cluster marker-cluster-' + clusterSize,
        iconSize: new L.Point(x, y)
      });
    }
  });
  
  cx = crossfilter();
  byDate = cx.dimension(function(d){ return d3.time.day(new Date(d.createdAt))});
  byDateGroup = byDate.group().reduceCount(); //report count grouped by date
  byAddress = cx.dimension(function(d){ 
    var lastToken = d.geo.addressComponents.formattedAddress.split(',').pop()
    return lastToken;
  })
  byAddressGroup = byAddress.group().reduceCount() //report count grouped by address
  byDeployment = cx.dimension(function(d){ return d.author.name});
  byDeploymentGroup = byDeployment.group().reduceCount() //report count grouped by deployment names
  
  $('#charts').hide()

  var dateLabelFormatter = d3.time.format('%b %e, %Y');
  
  function limitToTopFive(group) {
    return {
      all : function(){
        return group.top(5);
      }
    };
  }

  function updateDateLabel(start, end) {
    $('#dateRange').text(start + ' – ' + end);
  }
  
  function createBarChart() {
    var mindate = d3.time.day(new Date(byDate.bottom(1)[0].createdAt));
    var maxdate = d3.time.day(new Date(byDate.top(1)[0].createdAt));
    updateDateLabel( dateLabelFormatter(mindate) , dateLabelFormatter(maxdate) );
    var xscale = d3.time.scale()
      .domain([mindate, maxdate])
    ;
    return dc.barChart('#byDateChart')
      .width(500)
      .height(200)
      .elasticY(true)
      .elasticX(true)
      .dimension(byDate)
      .group(byDateGroup)
      .xUnits(d3.time.days)
      .brushOn(true)
      .xAxisPadding('5%')
      .margins({top:10,right:30,bottom:20,left:60})
      .x(xscale)
      .xAxis().ticks(5)
    ;
  }
  
  function createByAddressChart() {
    return dc.rowChart('#byAddressChart')
      .width(500)
      .height(200)
      .elasticX(true)
      .dimension(byAddress)
      .group(limitToTopFive(byAddressGroup))
      .ordering(function(d){return -d.value;})
      // .xUnits(d3.time.days)
      // .margins({top:10,right:30,bottom:20,left:60})
    ; 
  }

  function createByDeploymentChart() {
    return dc.rowChart('#byDeploymentChart')
      .width(500)
      .height(200)
      .elasticX(true)
      .dimension(byDeployment)
      .group(limitToTopFive(byDeploymentGroup))
      .ordering(function(d){return -d.value;})
      // .xUnits(d3.time.days)
      // .margins({top:10,right:30,bottom:20,left:60})
    ; 
  }

  function reCalculateReportsAndDeployments() {
    var authorsId = [];
    var reports = 0;

    var level = map.getZoom();
    var round = 591657550.500000 / Math.pow( 2, level-1);

    if (zoom < level){
      zoom++;

      api.getData('getAddressPoints', {
        limit: 250,
        distance: round,
        location: map.getCenter().lat+', '+ map.getCenter().lng
      }, function(responce){
        addMarkerToMaps(responce, {recalculate: false})
      })
    }

    api.getAllItems().map(function (item) {
      var latlng = L.latLng(item.geo.coords[1], item.geo.coords[0]);
      if (map.getBounds().contains(latlng)) {
        reports++;
        authorsId.push(item.author.remoteID);
      }
    });

    api.setViewed('reports', reports)
    api.setViewed('deployments', authorsId.filter(onlyUnique).length)

    $('.number-of-deployments').text(api.getViewed('deployments'));
    $('.number-of-reports').text(api.getViewed('reports'));
  }

  /**
   *
   * Function add maker on map
   *
   * @param data
   */
  function addMarkerToMaps(data, options) {
    if (!data) {
      return;
    }

    var options = options || null;

    var authorsId = [];


    data.data.map(function (item) {
      authorsId.push(item.author.remoteID);

      if (api.isItemAllreadyExist(item)){
        return;
      }
      cx.add([item]);
      api.addItem(item);

      var popupContent = '<div class="popup-title">' + item.summary + '</div>' +
        '<div class="popup-content">' + contentStrip(item.content) + '</div>' +
        ((item.fromURL) ? '<a href="' + 'google.ru' + '" class="popup-btn">More info</a>': '');

      var popupOption = {
        maxWidth: '400px',
        minWidth: '200px',
        offset: new L.Point(0, 0)
      }
      var marker = L.marker(L.latLng(item.geo.coords[1], item.geo.coords[0]), {title: item.summary});
      marker.bindPopup(popupContent, popupOption);
      markers.addLayer(marker);
    })


    apiCallCount++;

    //this condition is true after all api calls are made, 
    //although only the first time since apicallcount is never reset
    if (apiCallCount == config.markers.length) {
      
      byDateChart = createBarChart();
      // byDateChart.render();
      byAddressChart = createByAddressChart();
      // byAddressChart.render();
      byDeploymentChart = createByDeploymentChart();
      // byDeploymentChart.render();
      dc.renderAll();
      $('#charts').fadeIn();

      for (var i = data.data.length - 15; i <= data.data.length; ++i) {

        var template = _.template('<span class="msg"><%= title %>  - <a href="<%= link %>"><%= author %></a></span>');

        if (data.data[i] && data.data[i].summary && data.data[i].author.name) {
          $('.marquee').append(template({
            'title': data.data[i].summary,
            'link': 'javascript:;',
            'author': data.data[i].author.name
          }));
        }
      }
    }


    if (!options || options && options.recalculate){
      api.setViewed('reports', api.getViewed('reports') + data.data.length)
      $('.number-of-reports').text(api.getViewed('reports'));

      var depoloyments = api.setArrayOfAuthors(api.getArrayOfAuthors().concat(authorsId));
      api.setViewed('deployments', depoloyments.length)

      $('.number-of-deployments').text(api.getViewed('deployments'));
    }

    map.addLayer(markers);
  }

  function contentStrip(content) {
    var arrayOfWords = content.split(' ');

    return arrayOfWords.slice(0, 40).join(' ') + ((arrayOfWords.length > 40) ? '...' : '');
  }


});
