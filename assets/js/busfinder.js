$(document).ready(function() {
  console.log(L);
  console.log("!");
  var geocoder = new google.maps.Geocoder();
  var PHILLY_COORDS = [39.952222, -75.164167];
  var map = L.map('map', {zoomControl: false}).setView(PHILLY_COORDS, 12);

  L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg', {
    attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"> &copy; <a href="httpL//osm.org/copyright">OpenStreetMap</a> contributors',
    detectRetina: true
  }).addTo(map);

  var $zoomControl = $(".zoom-control div");
  $zoomControl.click(function(e){
    if($(this).data("action") == "in")
      map.zoomIn();
    else
      map.zoomOut();
  });


  var $searchView = $(".search-view");
  var $searchbar = $(".search");

  var $resultItems = $(".results .items");
  var $results = $(".results");

  var defaultHeight = $searchView.height();
  $searchView.height(defaultHeight);

  $searchbar.focus(function(){
    $(".search-label").css("opacity", 1);
    $(".placeholder").css("opacity", 0);
  });

  $searchbar.blur(function(){
    if($searchbar.val() == "") {
      $(".search-label").css("opacity", 0);
      $(".placeholder").css("opacity", 1);
    }
  });

  $searchbar.keyup(function() {
    var address = $searchbar.val();
    if(address != "") {
      delay(function() {
        geocoder.geocode( { 'address': address + " pennsylvania"}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            //var coords = [results[0].geometry.location.d, results[0].geometry.location.e];
            var coords = PHILLY_COORDS;
            if(coords != null) {
              console.log("LOLL");
              map.setView(coords, 14);
            }

            var loc = "assets/json/stops1.json";

            $.getJSON(loc, {lat:coords[0] , long:coords[1]}, function(data){
              $results.css("display", "block");
              $results.css("opacity", 1);
              $resultItems.html("");
              $searchView.height(defaultHeight + $(".results").height());
              for(var index in data) {
                $resultItems.append("<div>" + data[index].location_name + "</div>");
              }

              $searchView.height(defaultHeight + $results.height());

            });
          } else {
        
          }
        });
      },750);

    } else {
      $(".results").css("opacity", 0);
      $searchView.height(defaultHeight);
    }
  });

  var delay = (function(){
    var timer = 0;
    return function(callback, ms){
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
    };
  })();


});