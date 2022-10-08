import React, { useState, useEffect } from "react";
import ReactMapGL, {
  GeolocateControl,
  Marker,
  Source,
  Layer,
} from "react-map-gl";
import mapbox from "@mapbox/mapbox-sdk/services/geocoding";
import "./App.css";

import * as Papa from "papaparse";
import evictions from "./evictions.json";

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("access_token");

function App() {
  return (
    <div className="App">
      <Map />
    </div>
  );
}

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
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
    zoom: 11,
  });
  const [data, setData] = useState(
    localStorage.getItem("eviction_data_raw")
      ? JSON.parse(localStorage.getItem("eviction_data_raw"))
      : []
  );
  const [isLoaded, setIsLoaded] = useState(data.length > 0);
  const [geojson, setGeojson] = useState(evictions);
  // const mapboxClient = mapbox({
  //   accessToken: token,
  // });

  useEffect(() => {
    if (data.length === 0) {
      Papa.parse("https://data.cityofnewyork.us/resource/6z8x-wfk4.csv", {
        download: true,
        header: true,
        worker: true,
        complete: function (results) {
          localStorage.setItem(
            "eviction_data_raw",
            JSON.stringify(results.data)
          );
          setData(results.data);
          setIsLoaded(true);
        },
      });
    }
  }, []);

  // useEffect(() => {
  //   if (!isLoaded || geojson.features.length >= 1000) return;

  //   data
  //     .slice(geojson.features.length, geojson.features.length + 200)
  //     .forEach(async ({ eviction_address }) => {
  //       if (!eviction_address) return;
  //       let f = await mapboxClient
  //         .forwardGeocode({
  //           query: eviction_address,
  //           autocomplete: false,
  //           countries: ["us"],
  //           proximity: [-73.9599926, 40.6822465],
  //           limit: 1,
  //         })
  //         .send();

  //       const coord =
  //         f && f.body && f.body.features && f.body.features.length
  //           ? {
  //               type: "Feature",
  //               geometry: {
  //                 type: "Point",
  //                 coordinates: f.body.features[0].center,
  //               },
  //             }
  //           : {
  //               type: "Feature",
  //               geometry: { type: "Point", coordinates: [0, 0] },
  //             };

  //       setGeojson((current) => ({
  //         type: "FeatureCollection",
  //         features: current.features.concat([coord]),
  //       }));
  //     });
  // }, [isLoaded]);

  // useEffect(() => {
  //   localStorage.setItem("eviction_data", JSON.stringify(geojson.features));
  //   console.log("current data:", geojson);
  //   download("evictions.json", JSON.stringify(geojson));
  // }, [geojson]);

  return (
    <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      onViewportChange={(nextViewport) => setViewport(nextViewport)}
    >
      <GeolocateControl
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation={true}
        style={{
          position: "absolute",
          display: "table",
          top: "8px",
          left: "8px",
        }}
      />
      <Source id="evictions" type="geojson" data={geojson}>
        <Layer
          id="points"
          type="circle"
          paint={{
            "circle-radius": 1,
            "circle-color": "#ff0000",
          }}
        />
      </Source>
    </ReactMapGL>
  );
}

export default App;
