var templates = {
  resultItem: function(obj) {
    return "<div data-src='[" + obj.lat + "," + obj.lon + "]'>" + obj.name + "</div>";
  }
};

var currentView;
var currentMarkers = {};

$(document).ready(function() {  
  
  //console.log(document  

  window.PHILLY_COORDS = [39.952222, -75.164167];

  window.$searchView = $(".search-view");
  window.$busView = $(".bus-view");
  window.$stopView = $(".stop-view");
  window.$nearbyView = $(".nearby-view");
  window.$aboutView = $(".about-view");

  window.$viewWrapper = $(".view-wrapper");

  window.$navigation = $(".menu");
  window.$breadcrumb = $(".breadcrumbs");

  //var $searchbar = $(".search");
  //var $resultItems = $(".results .items");
  //var $results = $(".results");
  var $zoomControl = $(".zoom-control div");


  window.defaultHeight = $searchView.height();

  window.geocoder = new google.maps.Geocoder();
  window.map = L.map('map', {zoomControl: false}).setView(PHILLY_COORDS, 12);

  // initialize tile layers
  L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg', {
    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"> &copy; <a href="httpL//osm.org/copyright">OpenStreetMap</a> contributors',
    detectRetina: true
  }).addTo(map);

  // initialize search height
  $searchView.height(defaultHeight);  

  // initalize location 
  ///loadLocation(document.location.pathname);

    // zooming in and out
    $zoomControl.click(function(e){
      if($(this).data("action") == "in")
        map.zoomIn();
      else
        map.zoomOut();
    });

  $navigation.on("click", "span", function(){
    var $this = $(this);
    var url = $this.data("url");    
    loadLocation(url, true);
  });
  
  // focusing the searchbar
  $viewWrapper
  .on("focus", ".search", function(){
    var $this = $(this);
    $this.siblings(".search-label").css("opacity", 1);
    $this.siblings(".placeholder").css("opacity", 0);
  })
  .on("blur", ".search", function(){
    var $this = $(this);
    if($this.val() == "") {
      var label = $this.siblings(".search-label").css("opacity", 0);
      var label = $this.siblings(".placeholder").css("opacity", 1);
    }
  })
  .on("keyup", ".search", function() {    
    var $this = $(this);
    delay(function() {
      var query = $this.val().split(" ").join("+");
      var address = encodeURI(query);
      loadLocation("/search/" + address, false);
    }, 750);
  }).on("click", ".search-wrapper", function() {
    var $this =$(this);
    $this.find(".search").focus();
  }).on("mouseover", ".items div", function(data){
    var id = $(this).data("src");
    currentMarkers[id].setOpacity(1);
  }).on("mouseout", ".items div", function(data){
    var id = $(this).data("src");
    currentMarkers[id].setOpacity(.5);
  });

  var plotPoint = function (lat, long, extra) {
    var marker = L.marker([lat, long]);
    marker.addTo(map);
    currentMarkers.push(marker);
  }

});

function loadLocation(url, newWindow) {
  var parsed = url.split("/").slice(1);
  console.log(parsed);
  var state = {
    location: parsed
  }
  history.pushState(state, "PhillyBusFinder", url);
  initializeLocation(parsed, newWindow);
}

function initializeLocation(state, newWindow) {
  var location = state[0];
  if(location == "stop"){
    loadStop();
  } else if (location == "bus") {
    initializeBus(state[1], newWindow);
  } else if (location == "search") {
    initializeSearch(state[1], newWindow);
  } else if (location == "nearby") {
    initializeNearby(newWindow);
  } else if (location == "about") {
    initializeAbout(newWindow);
  }
}

function initializeAbout (query) {
  setCurrentView("about");
  resetLocation();
}

function initializeBus(query) {
  setCurrentView("bus");
}

function initializeNearby() { 
  var $this = $(".view-wrapper .nearby:last");
  setCurrentView("nearby");

  navigator.geolocation.getCurrentPosition(function(position) {
    console.log("position");
    var coords = [position.coords.latitude, position.coords.longitude];
    if(coords != null) {
      map.setView(coords, 16, {pan: {animate: true}});
    }

    var loc = "/api/stops/nearby";            

    $.getJSON(loc, {lat:coords[0] , long:coords[1]}, function(data){
      var newMarkers = {};
      clearMarkers();
      for(var index in data) {
        console.log(data[index]);
        var obj = data[index];
        newMarkers[""+[obj.lat, obj.lon]] = L.marker([obj.lat, obj.lon]);
        bulkPlot(newMarkers);
      }
    });

  }, function() {
    console.log("errorrrrr");  
  });
}

function initializeSearch(q, newWindow) {
    console.log(q);
    console.log(newWindow);
    if(q)      
      var query = q.split("+").join(" ");
    if(newWindow) {
      setCurrentView("search");
      if(query) currentView.find(".search").val(query);
    }
    var $this = $(".view-wrapper .search:last");
  
    if(query) {
      $this.siblings(".search-label").css("opacity", 1);
      $this.siblings(".placeholder").css("opacity", 0);
    }
    
    if(query) 
      var address = query;
    else
      var address = "";
    //var address = $this.val();
    var $view = $this.parents(".view");
    var $results = $this.parent().siblings(".results");
    var $resultItems = $results.find(".items");
    if(address != "") {
        geocoder.geocode( { 'address': address + " pennsylvania"}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var coords = [results[0].geometry.location.d, results[0].geometry.location.e];
            //var coords = PHILLY_COORDS;
            if(coords != null) {
              map.setView(coords, 16, {pan: {animate: true}});
            }

            //var loc = "assets/json/stops1.json";
            var loc = "/api/stops/nearby";            

            $.getJSON(loc, {lat:coords[0] , long:coords[1]}, function(data){
              $results.css("display", "block");
              $results.css("opacity", 1);
              $resultItems.html("");
              $view.height(defaultHeight + $results.height());
              var newMarkers = {};
              clearMarkers();
              for(var index in data) {
                var obj = data[index];
                $resultItems.append(templates.resultItem(obj));
                newMarkers[""+[obj.lat, obj.lon]] = L.marker([obj.lat, obj.lon]);
              }
              bulkPlot(newMarkers);
              $view.height(defaultHeight + $results.height());

            });
          }
        });

    } else {
      $results.css("opacity", 0);
      $view.height(defaultHeight);
    }
}

function hideCurrentView() {
  if(currentView) {
    currentView.fadeOut(200);    
    currentView.css("left", "-10px");
  }
}

function showCurrentView() {
  $viewWrapper.append(currentView);
  currentView.fadeIn(200);  
  currentView.css("left", "0px");
}

function setCurrentView(view, obj) {
  hideCurrentView();
  if(view == "search") {
    currentView = $searchView.clone();
  } else if (view == "bus") {
    currentView = $busView.clone();
  } else if (view == "stop") {
    currentView = $stopView.clone();
  } else if (view == "about") {
    currentView = $aboutView.clone();
  } else if (view == "nearby") {
    currentView = $nearbyView.clone();
  }
  showCurrentView();
}

function setBreadcrumb(url){
  
}

window.onpopstate = function() {
  var currentState;
  console.log("THE STATE GOES POP POP");
  if(history.state != null) {
    console.log("UR HISTORY");
    console.log(history.state.location);
    initializeLocation(history.state.location, true);
  } else {
    loadLocation(document.location.pathname);
  }  
}
 

  var delay = (function(){
    var timer = 0;
    return function(callback, ms){
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
    };
  })();

  var bulkPlot = function(list) {
    currentMarkers = list;
    for(var i in list) {
      list[i].setOpacity(.5);
      map.addLayer(list[i]);
    }
  }  

  var clearMarkers = function() {
    console.log(currentMarkers);
    for(var i in currentMarkers) {
      map.removeLayer(currentMarkers[i]);
    }
    currentMarkers = {};
  }

  var resetLocation = function () {
    clearMarkers();
    map.setView(PHILLY_COORDS, 12);
  }
