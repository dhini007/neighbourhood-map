var map; //variable to store the map
var markers = []; //an array to store the various markers
var marker; //variable used to store the current marker
var largeInfowindow; //variable used for infoWindow

//this is the array that stores the the locations along with their respective titles
var locations = [{
  title: 'Washington Square Park',
  location: {
    lat: 40.730823,
    lng: -73.997332
  }
},
{
  title: 'Lower East Side Tenement Museum',
  location: {
    lat: 40.7187958,
    lng: -73.99006969999999
  }
},
{
  title: 'Battery Park',
  location: {
    lat: 40.702495,
    lng: -74.016859
  }
},
{
  title: 'St. Patrick\'s Old Cathedral',
  location: {
    lat: 40.723556,
    lng: -73.995114
  }
},
{
  title: 'Empire State Building',
  location: {
    lat: 40.7484405,
    lng: -73.98566440000002
  }
},
{
  title: 'High Line',
  location: {
    lat: 40.7459912,
    lng: -74.00499830000001
  }
}
];

// Asynchronosuly load google maps api and check for error
$(function () {
  $.getScript("https://maps.googleapis.com/maps/api/js?v=3&key=AIzaSyCmTsP-663iQTyjzp6rW-gqOGTs9rsgRGU")
    .done(function (script, textStatus) {
      initMap();
    })
    .fail(function (jqxhr, settings, ex) {
      alert("Could not load Google Map script: Make sure you're connected to the internet");
    });
});

//function used to initialise the map
function initMap () {
  //creating the map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 40.723556,
      lng: -73.995114
    },
    zoom: 14
  });
  // Create a single latLng literal object.

  largeInfowindow = new google.maps.InfoWindow(); //variable used to create and store the infoWindow
  var bounds = new google.maps.LatLngBounds();
  //iterating over the entire length of the locations array to create markers accordingly
  for (var i = 0; i < locations.length; i++) {
    var position = locations[i].location; //variable used for storing the current location from the locations array
    var title = locations[i].title; //variable used for storing the title of the current location from the locations array
    //creating marker with some properties
    marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });
    var latLng = marker.getPosition();
    map.setCenter(latLng);
    //var marker=locationData(location[i]);
    markers.push(marker); //pusing the currently created marker into the markers array which is used for storing all markers
    bounds.extend(marker.position);
    //adding a click listener on each marker to toggle the animation of the respective marker
    //and populate the infoWindow with the information accordingly
    marker.addListener('click', function () {
      toggleBounce(this, marker);
      populateInfoWindow(this, largeInfowindow);
    });
    marker.addListener('closeclick', function () {
      toggleBounce(this, marker);
    });
  }
  map.fitBounds(bounds);
}

//this is the function used to toggle the bounce of each marker
function toggleBounce (marker) {
  //if the marker doesnt is bouncing, make it stop bouncing
  if (marker.getAnimation() != null) {
    marker.setAnimation(null);
  }
  //else if the marker is idle,make it bounce on click
  else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () {
      marker.setAnimation(null);
    }, 1550);
  }
};


function locationData (data) {
  this.title = ko.observable(data.title); //knockout observable used for storing the respective title
  this.location = ko.observable(data.location); //knockout observable for storing the respective location
};

//this is the function responsible for populating the infoWindow with the correct information
function populateInfoWindow (marker, infowindow) {
  // if (infowindow.marker != marker) {
  infowindow.marker = marker;
  //making use of ajax to handle errors
  $.ajax({
    // Get Wikipidea summary for the place
    // API from https://www.mediawiki.org/wiki/API:Main_page
    url: 'https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&prop=extracts&exintro=&explaintext=&titles=' + marker.title,
    error: function (request, error) {
      //if any error occurs while retrieving data,set the content of the infoWindow to the following
      infowindow.setContent('<b>' + marker.title + '</b><br><div>Sorry we could not retrieve data from the server at this time. Please try again later.</div>');
      infowindow.open(map, marker);
      return;
    },
    success: function (data) {
      for (var prop in data.query.pages) {
        if (data.query.pages[prop].extract) {
          //if no error occurs and everything goes well,retrieve the relevant info and display it in the infoWindow
          infowindow.setContent('<b>' + marker.title + '</b><br><div class="infoSize">' + data.query.pages[prop].extract + '</div>');
        } else {
          //if the searched content doesnt exist in wikipedia, then display the following in the infoWindow
          infowindow.setContent('<b>' + marker.title + '</b><br><div>Sorry the place you were looking for could not be found on wikipedia.</div>');
        }
        infowindow.open(map, marker);
        return;
      }
    }
  });
  // }
}

//on clicking the toggler class, toggle the show class
$('.toggler').click(function () {
  $('.options-box').toggleClass('show');
});
//on clicking anywhere on the map when an infoWindow is open, close the infoWindow
$('#map').click(function () {
  largeInfowindow.close();
});

var viewModel = function () {
  var self = this;

  self.itemClick = function (marker) {
    var selectedMarker;
    //iterating over the list of markers
    for (var i = 0; i < markers.length; i++) {
      //if the current title is equal to the marker's title do the following
      //Get the correct string value of the marker title and check for match
      var title = typeof (marker.title) == 'string' ? marker.title : marker.title();
      if (markers[i].title == title) {
        selectedMarker = markers[i];
      }
    }
    //trigger the click even on the selected marker
    google.maps.event.trigger(selectedMarker, 'click');
  };


  self.locationList = ko.observableArray(); //creating an knockout observable array called locationList
  self.searchPoint = ko.observable(''); //creating an knockout observable called searchPoint

  //iterate over the locations and push the location data associated with each location into the observableArray locationList
  locations.forEach(function (data) {
    self.locationList.push(new locationData(data));
  });

  //this is the function for filtering locations for the user as he searches
  this.filteredLocations = function () {
    var inputSearch = self.searchPoint().toLowerCase();
    //Delete all locations in the list
    self.locationList.removeAll();
    // Make markers invisible for all
    for (var i = 0; i < markers.length; i++) {
      markers[i].setVisible(false);
    }
    if (inputSearch.length === 0) {
      // Add all locations back to list
      locations.forEach(function (data) {
        self.locationList.push(new locationData(data));
      });
      // Make markers visible for all
      for (var i = 0; i < markers.length; i++) {
        markers[i].setVisible(true);
      }
    } else {
      largeInfowindow.close();
      for (i = 0; i < locations.length; i++) {
        if (locations[i].title.toLowerCase().indexOf(inputSearch.toLowerCase()) > -1) {
          // Push filtered locations to location list
          self.locationList.push(locations[i]);
          console.log(markers[i])
          markers[i].setVisible(true);
        }
      }
    }
  };
};

ko.applyBindings(new viewModel());
