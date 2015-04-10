$(function () {

  var initialMarkers = config.markers;
  var apiCallCount = 0;

  var countryName = location.href.substring(location.href.lastIndexOf('/#')+1, location.href.length);
  countryName = countryName.replace('#','');
  initialMarkers.map(function (marker) {
    api.getData('getAddressPoints', marker, addMarkerToMaps)
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

  addMarkerToMaps();

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

      if (api.isItemAllradyExist(item)){
        return;
      }

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

    if (apiCallCount == config.markers.length) {
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
