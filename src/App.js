import React, { useState, useEffect, useLayoutEffect } from 'react';
import ReactMapGL, { GeolocateControl, Marker, Source, Layer } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import mapbox from '@mapbox/mapbox-sdk/services/geocoding'
import logo from './logo.svg';
import './App.css';

import * as Papa from 'papaparse'

// console.log(Papa)

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('access_token');

function App() {
  return (
    <div className="App">
      <Map />
    </div>
  );
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function Map() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    latitude: 40.6822465,
    longitude: -73.9599926,
    zoom: 11
  });
  const [data, setData] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [geojson, setGeojson] = useState({
    type: 'FeatureCollection',
    features: localStorage.getItem('eviction_data') ? JSON.parse(localStorage.getItem('eviction_data')) : []
  })
  const mapboxClient = mapbox({accessToken: process.env.REACT_APP_MAPBOX_TOKEN});

  useEffect(() => {

    if(data.length > 0) {
      setIsLoaded(true)
    }else {
      Papa.parse("https://data.cityofnewyork.us/api/views/6z8x-wfk4/rows.csv", {
      	download: true,
        header: true,
        worker: true,
      	complete: function(results) {
          setData(results.data)
          // localStorage.setItem('eviction_data_raw', JSON.stringify(results.data))
          setIsLoaded(true)
      	}
      });
    }
  }, [])

  // useEffect(() => {
  //   if(!isLoaded) return
  //
  //   data.slice(geojson.features.length, geojson.features.length + 1000).forEach(async ({EVICTION_ADDRESS}) => {
  //     let f = await mapboxClient.forwardGeocode({
  //       query: EVICTION_ADDRESS,
  //       autocomplete: false,
  //       countries: ["us"],
  //       proximity: [-73.9599926, 40.6822465],
  //       limit: 1
  //     }).send()
  //
  //     const coord = (
  //       f &&
  //       f.body &&
  //       f.body.features &&
  //       f.body.features.length
  //     ) ? {type: 'Feature', geometry: {type: 'Point', coordinates: f.body.features[0].center}}
  //       : {type: 'Feature', geometry: {type: 'Point', coordinates: [0, 0]}}
  //
  //     setGeojson(current => ({
  //       type: 'FeatureCollection',
  //       features: current.features.concat([coord])
  //     }))
  //   })
  // }, [isLoaded])

  // useEffect(() => {
  //   localStorage.setItem('eviction_data', JSON.stringify(geojson.features))
  //   console.log("current data:", geojson)
  // }, [geojson])

  return (
    <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      onViewportChange={nextViewport => setViewport(nextViewport)}
    >
      <GeolocateControl
        positionOptions={{enableHighAccuracy: true}}
        trackUserLocation={true}
        style={{
          position: 'absolute',
          display: 'table',
          top: '8px',
          left: '8px'
        }}
      />
      {/*data.slice(0, 200).map((eviction, i) => (
        <AddressMarker mapbox={mapboxClient} key={i} address={eviction.EVICTION_ADDRESS} />
      ))*/}
      <Source id="evictions" type="geojson" data={geojson}>
        <Layer id="points" type="circle" paint={{
            'circle-radius': 1,
            'circle-color': '#ff0000'
        }} />
      </Source>
    </ReactMapGL>
  );
}

function AddressMarker({ address, mapbox }) {
  const [longLat, setLongLat] = useState([0, 0])

  useEffect(() => {
    mapbox.forwardGeocode({
      query: address,
      autocomplete: false,
      countries: ["us"],
      proximity: [-73.9599926, 40.6822465],
      limit: 1
    }).send().then((res) => {
      if (
        res &&
        res.body &&
        res.body.features &&
        res.body.features.length
      ) {
        setLongLat(res.body.features[0].center)
      }
    })
  }, [])


  return (
    <Marker latitude={longLat[1]} longitude={longLat[0]} offsetLeft={-5} offsetTop={-5}>
        <div className="marker"></div>
    </Marker>
  )
}

export default App;
