var templates = {
  resultItem: function(obj, url) {
    return "<div data-src='[" + obj.lat + "," + obj.lon + "]' data-url='" + url + "'>" + obj.name + "</div>";
  }, 
  altItem: function(name, url) {
    return "<div data-url='" + url + "'>" + name + "</div>";
  }, 
  tableRow: function(obj) {
    if (obj.offset == 0) {
      var offset = "On time";
    } else { 
      var offset = obj.offset + " mins";
    }
    var time = new Date(obj.time).toLocaleTimeString();
    return "<tr><td>" + obj.destination.substr(0,15) + " ("+obj.route + ")</td><td>" + time + "</td><td>" + offset + "</td></tr>";
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
  window.$recentView = $(".recent-view");
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
    $this.parent(".placeholder").css("opacity", 0);
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
    if(id in currentMarkers) currentMarkers[id].setOpacity(1);
  }).on("mouseout", ".items div", function(data){
    var id = $(this).data("src");
    if(id in currentMarkers) currentMarkers[id].setOpacity(.5);
  }).on("click", ".items div", function(data){ 
    console.log("!");
    var id = $(this).data("src");
    var url = $(this).data("url");   
    if(id in currentMarkers) { 
      var marker = currentMarkers[id];
      var latLng = marker.getLatLng();
      var coords = [latLng.lat, latLng.lng];
      console.log(coords);
      marker.setOpacity(1);
      focusMarker(marker);     
      storeVisitedStop(url.split("/")[2], coords);
    }
    loadLocation(url); 
  });

  var plotPoint = function (lat, long, extra) {
    var marker = L.marker([lat, long]);
    marker.addTo(map);
    currentMarkers.push(marker);
  }

});

function loadLocation(url, newWindow) {
  /*var parsed = url.split("/").slice(1);
  console.log(parsed);
  var state = {
    location: parsed
  }
  history.pushState(state, "PhillyBusFinder", url);
  initializeLocation(parsed, newWindow);*/
}

function initializeLocation(state, newWindow) {
  var location = state[0];
  if(location == "stop"){
    initializeStop(state[1], newWindow);
  } else if (location == "bus") {
    initializeBus(state[1], newWindow);
  } else if (location == "search") {
    initializeSearch(state[1], newWindow);
  } else if (location == "nearby") {
    initializeNearby(newWindow);
  } else if (location == "about") {
    initializeAbout(newWindow);
  } else if (location == "stop") {
    initializeStop(state[1], newWindow);
  } else if (location == "recent") {
    initializeRecent();
  }
}

function initializeAbout (query) {
  setCurrentView("about");
  resetLocation();
}

function initializeRecent (query) {
  resetLocation();
  setCurrentView("recent");
  var stops = JSON.parse(localStorage.getItem("stops"));
  var $this = $(".view-wrapper .recent-view:last");
  var list = $this.find(".items");
  list.html("");
  if(stops != null){
    var len = stops.length;
    if(len > 0) {
      for(var i = len-1; i >= 0; i--) {
        var url = "/stop/" + stops[i].id;
        list.append(templates.altItem(stops[i].name, url));
      }
    } else {
      list.html("No recent stops");
    }
  } else {
    list.html("No recent stops");
  }

}

function initializeBus(query) {
  setCurrentView("bus");
}

function initializeStop(query) {
  var call = "/api/stops/schedules";
  if(query != null) {
    $.getJSON(call, {stopId: query}, function(data){ 
      setCurrentView("stop");
      var $this = $(".view-wrapper .view:last");

      var title = "Stop #" + query;
      $this.find(".title").html(title);

      var latest = data[0];
      var schedule = data.slice(1,6);
 
      
      if(data.length> 0){
        $this.find(".route .data").html(latest.route);
    
        if (latest.offset == 0) {
          var offset = "On time";
        } else { 
          var offset = latest.offset + " mins";
        }
        $this.find(".delay .data").html(offset);
        var time = new Date(latest.time).toLocaleTimeString();
        $this.find(".arrival .data").html(time);        
        if(latest.destination != "")
          $this.find(".destination .data").html(latest.destination);        
        else
          $this.find(".destination").html("");
  
        var table = $this.find("table").html("");

        for(var index in schedule){
          table.append(templates.tableRow(schedule[index]));
        }
      } else {

        $this.html("<div class='title'>" + title + "</div><div>There are currently no active buses for this stop.</div>");
      }

    
    });

    
  }
   
} 

function initializeNearby() { 

  clearMarkers();
  setCurrentView("nearby");

  var $this = $(".view-wrapper .nearby-view:last");
  var $items = $this.find(".items");
  $items.html("");

  window.cc = $this;

  navigator.geolocation.getCurrentPosition(function(position) {
    var coords = [position.coords.latitude, position.coords.longitude];
    if(coords != null) {
      map.setView(coords, 16, {pan: {animate: true}});
    }

    var loc = "/api/stops/nearby";            


    $.getJSON(loc, {lat:coords[0] , long:coords[1]}, function(data){
      var newMarkers = {};
      for(var index in data) {
        var obj = data[index];
        var url = "/stop/" + obj.id;
        $items.append(templates.resultItem(obj, url));
        var marker = L.marker([obj.lat, obj.lon]);
        marker.on('click', function(){
          focusMarker(this);
          loadLocation(url);
        })
        .on('mouseover', function(){ this.setOpacity(1);})
        .on('mouseout', function(){ this.setOpacity(.5);})
        newMarkers[""+[obj.lat, obj.lon]] = marker;
      }
      bulkPlot(newMarkers);
    });

  }, function() {
    console.log("error");  
  });
}

function initializeSearch(q, newWindow) {
    resetLocation();
    if(q) {
      var query = q.split("+").join(" ");
      query = query.split("%20").join(" ");
    }
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
                var url = "/stop/" + obj.id;
                $resultItems.append(templates.resultItem(obj, url));
                var marker = L.marker([obj.lat, obj.lon]);
                newMarkers[""+[obj.lat, obj.lon]] = marker;
                marker.on('click', function(){
                  focusMarker(this);
                  loadLocation(url);
                })
                .on('mouseover', function(){ this.setOpacity(1);})
                .on('mouseout', function(){ this.setOpacity(.5);})
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
  } else if (view == "recent") {
    currentView = $recentView.clone();
  }
  showCurrentView();
}

window.onpopstate = function() {
  var currentState;
  /*if(history.state != null) {
    initializeLocation(history.state.location, true);
  } else {
    loadLocation(document.location.pathname, true);
  } */
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
    for(var i in currentMarkers) {
      map.removeLayer(currentMarkers[i]);
    }
    currentMarkers = {};
  }

  var focusMarker = function(marker) {
      clearMarkers();
      currentMarkers = {"focus": marker};
      map.addLayer(marker);
      var latlng = marker.getLatLng();
      map.setView(latlng, 17);
  }

  var resetLocation = function () {
    clearMarkers();
    map.setView(PHILLY_COORDS, 12);
  }

  var storeVisitedStop = function(stop,latlng) {
    var obj = JSON.parse(localStorage.getItem("stops"));
    if(obj == null){
      obj = [];
    }
    var newStop = {
      id: stop,
      name: "Stop #" + stop,
      coords: latlng
    }
    console.log(obj);
    if(""+stop in obj)
      delete obj[stop];
    obj.push(newStop);
    localStorage.setItem("stops", JSON.stringify(obj));
  }

  var resetStorage = function() {
    localStorage.setItem("stops", JSON.stringify(null));

  }
