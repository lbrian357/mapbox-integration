var mapboxAccesskey = 'get-key-from-mapbox-account';
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
var cityUrlName = location.pathname.split('/')[1].split('-')[0];
var eatsSectionRef = 'eats';
var staysSectionRef = 'stays';
var sightsSectionRef = 'sights';

var carouselArrow = '<svg width="19" height="9" viewBox="0 0 19 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M13 0L19 4.5L13 9V5.27942H0.703704C0.315059 5.27942 0 4.93046 0 4.5C0 4.06954 0.315059 3.72058 0.703704 3.72058H13V0Z" fill="black"/> </svg>';

function instaHandle(link) {
  if (link) {
    var handle = `@${link.split('/').slice(-2)[0]}`
    return handle;
  } else {
    return '';
  }
}
function maybeAddProtocol(url) {
  if (url?.includes('http')) {
    return url;
  } else {
    return `https://${url}`;
  }
}

function placeCard(place, index, section) {
  var mapPageLink = `places?id=${index}&section=${section}&city=${cityUrlName}`;

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

  var instaCreditEl = place.properties.image_credit ? (
    `<div class="insta-credit">
          Credit | <a href="${place.properties.image_credit}" target="_blank">${instaHandle(place.properties.image_credit)}</a>
        </div>`
  ) : '';


  return `
    <div>
      <div class="card-img-container">
        <a href="${mapPageLink}">
          <img src="${maybeAddProtocol(place.properties.image)}" alt='${place.properties.description}'>
        </a>
        ${instaCreditEl}
      </div>
      <a href="${mapPageLink}">
        <h3 class="place-heading">${place.properties.place_name}</h3>
      </a>
      <div class="insta-handle">
        <a href="${place.properties.instagram}" target="_blank">${instaHandle(place.properties.instagram)}</a>
      </div>
      <div class="card-description">
        <div class="description-text">
          ${descriptionHtml}
        </div>
        <div class="access-text">
          ${accessText}
        </div>
      </div>
      <a class="carousel-go-arrow" href="${mapPageLink}">${carouselArrow}</a>
    </div>
  `;
}

function sortFeaturesByOrderProp(mapboxDataset) {
  mapboxDataset['features'] = mapboxDataset.features.sort(function(a, b) {
    return parseInt(a.properties.order) - parseInt(b.properties.order);
  });
}

function addSectionMapLink(element, section) {
  var sectionMapUrl = `places?section=${section}&city=${cityUrlName}`;
  $(element).before(`
    <a class="map-link" href="${sectionMapUrl}">Explore the map</a>
  `);
}

//
// Get Datasets
//
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

Promise
  .all([eatsRequest, staysRequest, sightsRequest])
  .then(function(values) {
    var eatsData = values[0].data;
    var staysData = values[1].data;
    var sightsData = values[2].data;

    //
    // Sort features array by each item's order property
    //
    sortFeaturesByOrderProp(eatsData);
    sortFeaturesByOrderProp(staysData);
    sortFeaturesByOrderProp(sightsData);

    //
    // Setup carousel HTML markup
    //
    eatsData.features.forEach(function(place, i) {
      $('.eats-carousel').append(placeCard(place, i, eatsSectionRef));
    })
    sightsData.features.forEach(function(place, i) {
      $('.sights-carousel').append(placeCard(place, i, sightsSectionRef));
    })
    staysData.features.forEach(function(place, i) {
      $('.stays-carousel').append(placeCard(place, i, staysSectionRef));
    })

    //
    // Setup Carousel Heading
    //
    addSectionMapLink($('.eats-carousel'), eatsSectionRef);
    addSectionMapLink($('.sights-carousel'), sightsSectionRef);
    addSectionMapLink($('.stays-carousel'), staysSectionRef);

    //
    // Add Carousel functionality
    //
    if (/Mobi/.test(navigator.userAgent) || window.innerWidth < 600) {
      // for mobile
      $('.places-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: true,
        infinite: true,
        swipeToSlide: true,
      });
    } else {
      $('.places-carousel').slick({
        slidesToShow: 4,
        slidesToScroll: 1,
        variableWidth: true,
        infinite: true,
        swipeToSlide: true,
      });
    }

    //
    // Add Carousel custom styles and functionality
    //
    $('.slick-next').html('<i class="material-icons">keyboard_arrow_right</i>')
    $('.slick-prev').html('<i class="material-icons">keyboard_arrow_left</i>')
  });

