const GeoJSON = require('geojson');
const evs = require('../data/evictions_raw.json')
const { writeFile } = require('fs');

const evGeo = GeoJSON.parse(evs, {Point: ['Latitude', 'Longitude']});

evGeo.features.forEach((f, i) => {
    f.properties.id = i
});

writeFile('./evictions.geojson', JSON.stringify(evGeo), (error) => {
    if (error) {
      console.log('An error has occurred ', error);
      return;
    }
    console.log('Data written successfully to disk');
});
