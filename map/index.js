var mapboxAccesskey = 'get-mapbox-key-from-mapbox-account';
var mapboxDatasets = {
  toronto: {
    eats: 'https://api.mapbox.com/datasets/v1/path/to/features',
    sights: 'https://api.mapbox.com/datasets/v1/path/to/features',
    stays: 'https://api.mapbox.com/datasets/v1/path/to/features',
    startingPoint: [-79.381241, 43.652604] // starting position [lng, lat]
  },
  london: {
    eats: 'https://api.mapbox.com/datasets/v1/path/to/features',
    sights: 'https://api.mapbox.com/datasets/v1/path/to/features',
    stays: 'https://api.mapbox.com/datasets/v1/path/to/features',
    startingPoint: [-0.12838421793713856, 51.507194292715894]
  },
  brooklyn: {
    eats: 'https://api.mapbox.com/datasets/v1/path/to/features',
    sights: 'https://api.mapbox.com/datasets/v1/path/to/features',
    stays: 'https://api.mapbox.com/datasets/v1/path/to/features',
    startingPoint: [-73.944656, 40.675694]
  },
  paris: {
    eats: 'https://api.mapbox.com/datasets/v1/path/to/features',
    sights: 'https://api.mapbox.com/datasets/v1/path/to/features',
    stays: 'https://api.mapbox.com/datasets/v1/path/to/features',
    startingPoint: [ 2.3416124, 48.8547102]
  },
  losangeles: {
    eats: 'https://api.mapbox.com/datasets/v1/path/to/features',
    sights: 'https://api.mapbox.com/datasets/v1/path/to/features',
    stays: 'https://api.mapbox.com/datasets/v1/path/to/features',
    startingPoint: [-118.252838, 34.048520]
  }
}
var queryParamsStr = location.search.substring(1);
var queryParamsObj = queryParamsStr ? JSON.parse('{"' + decodeURI(queryParamsStr).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}') : '';
var cityUrlName = queryParamsObj.city ? queryParamsObj.city : '';
var eatsSectionRef = 'eats';
var staysSectionRef = 'stays';
var sightsSectionRef = 'sights';

var pin = 'https://static1.squarespace.com/static/path/to/pin.png';
var pinSelected = 'https://static1.squarespace.com/static/path/to/pin_selected.png';
var pinSelectedEl = document.createElement('img')
pinSelectedEl.src = pinSelected;
pinSelectedEl.style.cssText = 'height: auto; width: 95px; padding-right: 2px;'

// Polyfill for .remove()
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

function instaHandle(link) {
  var handle = `@${link.split('/').slice(-2)[0]}`
  if (handle) {
    return handle;
  } else {
    return '';
  }
}

function urlToText(url) {
  if (!url) return '';

  var formattedUrl = url;
  if (url.includes('//')) {
    // remove http/s protocol
    var formattedUrl = formattedUrl.split('//')[1];
  }
  if (formattedUrl.slice(-1) == '/') {
    // remove trailing forward slash
    formattedUrl = formattedUrl.slice(0, -1);
  }
  return formattedUrl.replace(/www\./, '');
}

function streetCityAddress(address) {
  if (!address) return '';

  return address.split(/, /).splice(0, 2).join(', ');
}

function phoneNumberToNum(str) {
  if (!str) return '';

  if (typeof(str) !== 'string') {
    return str;
  }

  return str.replace(/\D+/g, '')
}

function maybeAddProtocol(url) {
  if (!url) return '';

  if (url?.includes('http')) {
    return url;
  } else {
    return `https://${url}`;
  }
}

function placeCard(place, index, section) {
  // handle any quotes with insta handle as the description
  var descriptionHtml = '';
  if (place.properties.description_credit && place.properties.description) {
    var instaHandleText = instaHandle(place.properties.description_credit);
    descriptionHtml = place.properties.description.replace(instaHandleText, `<a href="${place.properties.description_credit}" target="_blank">${instaHandleText}</a>`)
  } else if (place.properties.description) {
    descriptionHtml = place.properties.description;
  }

  var accessText = '';
  if (place.properties["access"]) {
    accessText = place.properties["access"];
  }

  var cardContainer = document.createElement('div');
  cardContainer.className = 'card-container';
  cardContainer.id = `feature-${place.properties.id}`;

  /* Add image */
  var imgEl = `<img class="image" src="${maybeAddProtocol(place.properties.image)}" alt='${place.properties.description}'>`
  cardContainer.insertAdjacentHTML('beforeend', imgEl);

  /* Add details to the individual listing. */
  var detailsEl = `
    <span class="details">
      <a href=# class="title" id="link-${place.properties.id}">${place.properties.place_name}</a>
      ${place.properties.instagram ? 
        `<a href="${place.properties.instagram}" target="_blank">${instaHandle(place.properties.instagram)}</a>` 
      : ''}
      <div>
        <div class="address">${streetCityAddress(place.properties.address)}</div>
        <div>
          <a class="phone-number" href="tel:${phoneNumberToNum(place.properties.phone_number)}">${place.properties.phone_number || ''}</a>
        </div>
        <div>
          <a class="website" href="${place.properties.website}" target="_blank">${urlToText(place.properties.website)}</a>
        </div>
      </div>
      <a class="description-toggle">+ More</a>
      <div class="description">
        <div class="description-text">
          ${descriptionHtml}
        </div>
        <div class="access-text">
          ${accessText}
        </div>
      </div>
    </span>
  `;
  cardContainer.insertAdjacentHTML('beforeend', detailsEl);
  
  return cardContainer;
}

function carouselPlaceCard(place, index, section, includeTitle=false) {
  var carouselItem = document.createElement('div');
  carouselItem.classList.add('carousel-item');
  carouselItem.setAttribute('section', section);
  carouselItem.setAttribute('section-index', index);

  if (includeTitle) {
    /* Add item heading */
    var heading = carouselItem.appendChild(document.createElement('div'));
    heading.className = 'card-heading';
    if (section === eatsSectionRef) {
      heading.classList.add('eats-card-heading');
      heading.innerHTML = 'What to Eat'
    } else if (section === sightsSectionRef) {
      heading.classList.add('sights-card-heading');
      heading.innerHTML = 'What to See'
    } else if (section === staysSectionRef) {
      heading.classList.add('stays-card-heading');
      heading.innerHTML = 'Where to Stay'
    }
  }

  carouselItem.appendChild(placeCard(place, index, section));

  return carouselItem;
}

// Get Datasets
var eatsRequest = axios.get(
  mapboxDatasets[cityUrlName][eatsSectionRef],
  {
    params: {
      access_token: mapboxAccesskey
    }
  });
var staysRequest = axios.get(
  mapboxDatasets[cityUrlName][staysSectionRef],
  {
    params: {
      access_token: mapboxAccesskey
    }
  })
var sightsRequest = axios.get(
  mapboxDatasets[cityUrlName][sightsSectionRef],
  {
    params: {
      access_token: mapboxAccesskey
    }
  })


function sortFeaturesByOrderProp(mapboxDataset) {
  mapboxDataset['features'] = mapboxDataset.features.sort(function(a, b) {
    return parseInt(a.properties.order) - parseInt(b.properties.order);
  });
}

function getCapitalizeCityName(cityUrlName) {
  if (cityUrlName == 'losangeles') {
    return 'Los Angeles'
  } else {
    return cityUrlName.charAt(0).toUpperCase() + cityUrlName.slice(1)
  }
}

// Add back buttons
var backButtonHref = `/${cityUrlName}#${queryParamsObj.section}-section`;
$('.places-map-container .sidebar').prepend(
  `<div class="back-to-plp">&lt; <a href="${backButtonHref}">Return to ${getCapitalizeCityName(cityUrlName)} </a></div>`
);
$('.map.pad2').prepend(
  `<a class="mobile-back-btn" href="${backButtonHref}"><</a>`
)

// Init request
var eatsData;
var staysData;
var sightsData;
Promise
  .all([eatsRequest, staysRequest, sightsRequest])
  .then(function(values) {
    eatsData = values[0].data;
    staysData = values[1].data;
    sightsData = values[2].data;
    //
    // Sort features array by each item's order property
    //
    sortFeaturesByOrderProp(eatsData);
    sortFeaturesByOrderProp(staysData);
    sortFeaturesByOrderProp(sightsData);

    // Init Map
    mapboxgl.accessToken = mapboxAccesskey;
    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/path/to/style', // stylesheet location
      center: mapboxDatasets[cityUrlName]['startingPoint'],
      zoom: 12 // starting zoom
    });

    // Set places id
    eatsData.features.forEach(function(place, i) {
      place.properties.id = i;
    });
    sightsData.features.forEach(function(place, i) {
      place.properties.id = i;
    });
    staysData.features.forEach(function(place, i) {
      place.properties.id = i;
    });

    // Init map layer and map interactions
    map.on('load', function (e) {
      map.loadImage(
        pin,
        function(error, image) {
          if (error) throw error;
          map.addImage('pin', image);
        }
      )
      /* Add the eats data to your map as a layer */
      map.addLayer({
        "id": "eatsLocations",
        "type": "symbol",
        /* Add a GeoJSON source containing place coordinates and information. */
        "source": {
          "type": "geojson",
          "data": eatsData
        },
        "layout": {
          "icon-image": "pin",
          "icon-size": 0.5,
          "icon-allow-overlap": true,
        }
      });
      /* Add the sights data to your map as a layer */
      map.addLayer({
        "id": "sightsLocations",
        "type": "symbol",
        /* Add a GeoJSON source containing place coordinates and information. */
        "source": {
          "type": "geojson",
          "data": sightsData
        },
        "layout": {
          "icon-image": "pin",
          "icon-size": 0.5,
          "icon-allow-overlap": true,
        }
      });
      /* Add the stays data to your map as a layer */
      map.addLayer({
        "id": "staysLocations",
        "type": "symbol",
        /* Add a GeoJSON source containing place coordinates and information. */
        "source": {
          "type": "geojson",
          "data": staysData
        },
        "layout": {
          "icon-image": "pin",
          "icon-size": 0.5,
          "icon-allow-overlap": true,
        }
      });

      //
      /* Setup Desktop list */
      //
      buildLocationList(eatsData, eatsSectionRef);
      buildLocationList(sightsData, sightsSectionRef);
      buildLocationList(staysData, staysSectionRef);
      $('#eats-listings').before('<div class="heading">Where to eat</div>');
      $('#sights-listings').before('<div class="heading">What to see</div>');
      $('#stays-listings').before('<div class="heading">Where to stay</div>');
      //
      // Add Desktop list Event Listeners
      //
      var eatsLinks = document.querySelectorAll('#eats-listings.listings .item a');
      var sightsLinks = document.querySelectorAll('#sights-listings.listings .item a');
      var staysLinks = document.querySelectorAll('#stays-listings.listings .item a');
      addClickEventToLinks(eatsLinks, eatsData);
      addClickEventToLinks(sightsLinks, sightsData);
      addClickEventToLinks(staysLinks, staysData);
      var eatsCards = document.querySelectorAll('#eats-listings.listings .item');
      var sightsCards = document.querySelectorAll('#sights-listings.listings .item');
      var staysCards = document.querySelectorAll('#stays-listings.listings .item');
      addClickEventToCards(eatsCards, eatsData);
      addClickEventToCards(sightsCards, sightsData);
      addClickEventToCards(staysCards, staysData);
      //
      // Stop links in the card from bubbling up
      // and triggering click even on card
      // 
      $('.list-section .card-container a').on('click', function(e) { e.stopPropagation() });
      //
      // Add desktop map event listeners
      //
      addClickEventToMap(map);
      addHoverEventToMap(map);

      //
      /* Setup Carousel HTML for mobile viewport */
      //
      eatsData.features.forEach(function(place, i) {
        $('.places-carousel').append(carouselPlaceCard(place, i, eatsSectionRef));
      })
      sightsData.features.forEach(function(place, i) {
        $('.places-carousel').append(carouselPlaceCard(place, i, sightsSectionRef));
      })
      staysData.features.forEach(function(place, i) {
        $('.places-carousel').append(carouselPlaceCard(place, i, staysSectionRef));
      })
      // Init Carousel functionality
      $('.places-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: true,
        infinite: false,
      });
      // Add Carousel Heading
      $('.places-carousel').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
        var nextSection = $(`.places-carousel .carousel-item[data-slick-index="${nextSlide}"]`).attr('section');
        if (nextSection == 'eats') {
          $('.carousels-container .places-carousel-heading').text('What to Eat');
        }
        else if (nextSection == 'sights') {
          $('.carousels-container .places-carousel-heading').text('What to See');
        }
        else if (nextSection == 'stays') {
          $('.carousels-container .places-carousel-heading').text('Where to Stay');
        }
      });

      //
      // Set initial map point for mobile
      //
      if (window.innerWidth < 760) {
        activeListing = getActiveSlideListing();
        removePopUps()
        flyToStore(activeListing);
        $('.map').css('height', window.innerHeight);
      }
      // Centre and zoom into map when slide changes
      $('.places-carousel').on('afterChange', function(slick, currentSlide) {
        activeListing = getActiveSlideListing();
        removePopUps()
        flyToStore(activeListing);
      });

      // Add click even on description toggles
      $('.description-toggle').click(function() {
        if ($(this).html().includes('More')) {
          $(this).html('- Less');
        } else {
          $(this).html('+ More');
        }
        $(this).siblings('.description').slideToggle();
      });

      //
      // Set initial point based on query params
      //
      if (queryParamsObj) {
        var section = queryParamsObj.section
        if (section) {
          if (section === eatsSectionRef) {
            setInitialMapPoint(eatsData);
          } else if (section === sightsSectionRef) {
            setInitialMapPoint(sightsData);
          } else if (section === staysSectionRef) {
            setInitialMapPoint(staysData);
          }
        }
      }
    });

    //
    // UTILS
    //
    function getActiveSlideListing() {
      var activeSlide = document.querySelector('.places-carousel .slick-active');
      var activeListing;
      if (activeSlide.getAttribute('section') === eatsSectionRef) {
        activeListing = eatsData.features[activeSlide.getAttribute('section-index')];
      } else if (activeSlide.getAttribute('section') === sightsSectionRef) {
        activeListing = sightsData.features[activeSlide.getAttribute('section-index')];
      } else if (activeSlide.getAttribute('section') === staysSectionRef) {
        activeListing = staysData.features[activeSlide.getAttribute('section-index')];
      }
      return activeListing;
    }

    function buildLocationList(data, section) {
      data.features.forEach(function(place, i) {
        /**
         * Create a shortcut for `place.properties`,
         * which will be used several times below.
        **/
        var prop = place.properties;

        /* Add a new listing section to the sidebar. */
        var listings = document.getElementById(section + '-listings');
        var listing = listings.appendChild(document.createElement('div'));
        /* Assign a unique `id` to the listing. */
        listing.id = "listing-" + prop.id;
        /* Assign the `item` class to each listing for styling. */
        listing.className = 'item';

        listing.appendChild(placeCard(place, i, section));
      });
    }

    function flyToStore(currentFeature) {
      if (window.innerWidth < 760) {
        // account for mobile carousel that hides the pin under the carousel component 
        // when centered on the geometry.coorfinates
        latLong = currentFeature.geometry.coordinates
        adjustedLatLong = [latLong[0], latLong[1] - latLong[1]*0.0003]
        map.flyTo({
          center: adjustedLatLong,
          zoom: 13
        });
      } else {
        map.flyTo({
          center: currentFeature.geometry.coordinates,
          zoom: 13
        });
      }

      //// 
      // Add selected (orange) pin over the clickedPoint
      ////
      // Remove all other marker
      var markersOnMap = document.getElementsByClassName('mapboxgl-marker');
      if (markersOnMap.length > 0) markersOnMap[0].remove();
      // Set current marker
      var marker = new mapboxgl.Marker(pinSelectedEl)
        .setLngLat(currentFeature.geometry.coordinates)
        .addTo(map);
    }

    function createPopUp(currentFeature) {
      removePopUps();

      var popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML('<h3>' + currentFeature.properties.place_name + '</h3>' +
          '<h4>' + instaHandle(currentFeature.properties.instagram) + '</h4>')
        .addTo(map);
    }
    
    function removePopUps() {
      var popUps = document.getElementsByClassName('mapboxgl-popup');
      /** Check if there is already a popup on the map and if so, remove it */
      if (popUps[0]) popUps[0].remove();
    }

    function addClickEventToCards(cards, data) {
      cards.forEach(function(card) {
        card.addEventListener('click', function(e){
          var linkDataPosition = this.id.split('-')[1];
          var clickedListing = data.features[linkDataPosition];
          flyToStore(clickedListing);
          createPopUp(clickedListing);

          var activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          this.classList.add('active');
        });
      })
    }

    function addClickEventToLinks(links, data) {
      links.forEach(function(link) {
        link.addEventListener('click', function(e){
          var linkDataPosition = this.id.split('-')[1];
          var clickedListing = data.features[linkDataPosition];
          flyToStore(clickedListing);
          createPopUp(clickedListing);

          var activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          this.parentNode.parentNode.parentNode.classList.add('active');
        });
      })
    }

    function isScrolledToBottom(element) {
      return element.scrollTop + window.innerHeight === element.scrollHeight;
    }

    function scrollListingIntoView(element) {
      element.scrollIntoView();
      if (!isScrolledToBottom(document.querySelector('.sidebar'))) {
        document.querySelector('.sidebar').scrollBy(0, -190);
      }
    }

    function scrollCarouselItemIntoView(clickedPointObj) {
      var clickedPointName = clickedPointObj.properties.place_name;
      var indexOfClickedPointInCarousel = $(`.places-carousel .carousel-item .title:contains("${clickedPointName}")`).closest('.carousel-item').attr('data-slick-index');
      $('.places-carousel').slick('slickGoTo', indexOfClickedPointInCarousel);
    }

    function mapLayers() {
      return ['eatsLocations', 'sightsLocations', 'staysLocations'];
    }

    function addHoverEventToMap(map) {
      mapLayers().forEach(function(mapLayer) {
        map.on('mouseenter', mapLayer, function(e) {
          map.getCanvas().style.cursor = 'pointer';
          
          var hoveredPoint = e.features[0];
          createPopUp(hoveredPoint);
        });

        map.on('mouseleave', mapLayer, function() {
          map.getCanvas().style.cursor = '';
          removePopUps();
        });
      })
    }

    function addClickEventToMap(map) {
      map.on('click', function(e) {
        /* Determine if a feature in the "locations" layer exists at that point. */ 
        var features = map.queryRenderedFeatures(e.point, {
          layers: mapLayers()
        });

        /* If yes, then: */
        if (features.length) {
          var clickedPoint = features[0];
          var clickedSectionId;
          if (clickedPoint.source.includes(sightsSectionRef)) {
            clickedSectionId = 'sights-listings';
          } else if (clickedPoint.source.includes(eatsSectionRef)) {
            clickedSectionId = 'eats-listings';
          } else if (clickedPoint.source.includes(staysSectionRef)) {
            clickedSectionId = 'stays-listings';
          }

          /* Fly to the point */
          flyToStore(clickedPoint);

          /* Close all other popups and display popup for clicked place*/
          createPopUp(clickedPoint);

          /* Highlight listing in sidebar (and remove highlight for all other listings) */
          var activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          var listing = document.querySelector(`#${clickedSectionId} #listing-${clickedPoint.properties.id}`);
          listing.classList.add('active');

          /* Scroll highlighted listing into view */
          scrollListingIntoView(listing); // for desktop viewport
          scrollCarouselItemIntoView(clickedPoint); // for the mobile carousel
        }
      });
    }

    function setInitialMapPoint(data) {
      // Go to place on map if there is query string
      var search = location.search.substring(1);
      if (search) {
        var qStrObj = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
        
        if (qStrObj.id && qStrObj.section) {
          // when section and listing are in query params
          var linkDataPosition = qStrObj.id;
          var section = qStrObj.section
          var clickedListing = data.features[linkDataPosition];
          flyToStore(clickedListing);
          createPopUp(clickedListing);

          var activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          var newActiveItem = document.querySelector(`#${section}-listings #listing-${linkDataPosition}`);
          newActiveItem.classList.add('active');

          scrollListingIntoView(newActiveItem);
          scrollCarouselItemIntoView(clickedListing); // for the mobile carousel
        } else if (qStrObj.section) {
          // when only section is in query params
          var firstFeatureInListings = data.features[0];
          var listingToScrollTo = document.querySelector(`#${qStrObj.section}-listings #listing-0`);
          listingToScrollTo.classList.add('active');
          scrollListingIntoView(listingToScrollTo);
          scrollCarouselItemIntoView(firstFeatureInListings); // for the mobile carousel
        }
      }  
    } 
  });

