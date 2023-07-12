'use client'

import { useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { Card, Sheet, Tooltip } from '@mui/joy';
import { Protocol } from 'pmtiles';
import layers from 'protomaps-themes-base';
import { create } from 'zustand';

import 'maplibre-gl/dist/maplibre-gl.css';
import { animated, useTransition } from '@react-spring/web';

const useStore = create((set) => ({
  open: false,
  title: {},
  selected: [],
  setTooltip: (tooltip) => set((state) => ({ ...state, ...tooltip })),
  setSelected: (d) => set(({ selected, ...state }) => ({ ...state, selected: selected.find(s => s.id === d.id) ? selected : selected.concat([d]) })),
  remove: (id) => set(({ selected, ...state }) => ({...state, selected: selected.filter((j) => j.id !== id)}))
}))

function TooltipTitle({ properties }) {
  const filteredProps = [
    "Eviction Address",
    "Eviction Postcode",
    "Executed Date",
    "BOROUGH",
    "Census Tract",
    "Council District",
    "Community Board",
    "Court Index Number",
    "Docket Number"
  ]

  return (
    <div className='grid grid-cols-2 gap-1'>{filteredProps.map((k, i) => <p key={i}><strong>{k}:</strong>&nbsp;{properties[k]}</p>)}</div>
  )
}

const AnimatedCard = animated(Card)
function Eviction({ data, i, style }){
  const [setRemove] = useStore(
    (state) => [state.remove],
  )
  const remove = useCallback((i) => {
    setRemove(i)
  }, [setRemove, i])

  return (
      <AnimatedCard variant='plain' sx={{ minWidth: "300px", width: "300px", marginRight: "1rem", pointerEvents: "all", fontSize: "10px" }}>
        <TooltipTitle properties={data} />
        <button onClick={() => remove(data.id)} className='absolute -top-1.5 -right-1.5 w-[15px] min-w-0 min-h-0 h-[15px] rounded-full p-0 bg-white drop-shadow'>
          <span className='absolute top-1/2 left-1/2 w-[7px] h-[1px] bg-slate-400 -translate-x-1/2 -translate-y-1/2 rotate-45 origin-center'></span>
          <span className='absolute top-1/2 left-1/2 w-[7px] h-[1px] bg-slate-400 -translate-x-1/2 -translate-y-1/2 -rotate-45 origin-center'></span>
        </button>
      </AnimatedCard>
  )
}

function Cards(){
  const [selected] = useStore(
    (state) => [state.selected],
  )
  const transitions = useTransition(selected, {
    from: { y: 500, width: "316px" },
    enter: { y: 0 },
    leave: { y: 500, width: "0px" },
  })

  return (
    <div className='absolute bottom-0 left-0 text-xs flex items-end max-w-full overflow-x-scroll overflow-y-hidden p-5'>
      {transitions((style, item, _, i) => (
        <animated.div style={style}>
          <Eviction data={item} i={i} />
        </animated.div>
      ))}
    </div>
  )
}

export default function Home() {
  const bmLayers = layers("sample", "light")
  const mapRef = useRef(null)
  const hoverRef = useRef(null)
  const [open, title, setTooltip, setSelected] = useStore(
    (state) => [state.open, state.title, state.setTooltip, state.setSelected],
  )

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles",protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between relative overflow-hidden">
      <Sheet
        variant="plain"
        color="neutral"
        sx={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1,
          padding: "12px 16px",
          borderRadius: "12px"
        }}
      >
        <h1 className="text-xl font-bold mb-1">NYC Evictions&nbsp;<span className="font-normal text-xs">(2017 - Present)</span></h1>
        <p className="text-xs text-slate-500">Click on a point to save it for comparison.</p>
        <p className="text-xs text-slate-500">All data from <a className="underline" href="https://data.cityofnewyork.us/City-Government/Evictions/6z8x-wfk4" target='_blank'>NYC Open Data</a>.</p>
      </Sheet>
      <Tooltip
        title={<TooltipTitle properties={title} />}
        placement='top'
        arrow
        followCursor
        open={true}
        size='md'
        variant='plain'
        sx={{
          maxWidth: "400px",
          padding: "12px 14px",
          fontSize: "10px",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s ease-out"
        }}
      >
        <div>
          <Map
            ref={mapRef}
            mapLib={maplibregl}
            initialViewState={{
              latitude: 40.66680309719159,
              longitude: -73.99361004232853,
              zoom: 11
            }}
            onMouseDown={(e) => {
              if(e.features.length) {
                setSelected(e.features[0].properties)
              }
            }}
            onMouseMove={(e) => {
              if(e.features.length) {
                if (hoverRef.current) {
                  mapRef.current.setFeatureState(
                    { source: 'evictions', id: hoverRef.current, sourceLayer: "evictions" },
                    { hover: false }
                  )
                }
                setTooltip({
                  open: true,
                  title: e.features[0].properties
                })
                // console.log(e.features[0])
                hoverRef.current = e.features[0].id;
                mapRef.current?.setFeatureState(
                  { source: 'evictions', id: hoverRef.current, sourceLayer: "evictions" },
                  { hover: true }
                )
              }
            }}
            onMouseLeave={(e) => {
              if(hoverRef.current) {
                mapRef.current.setFeatureState(
                  { source: 'evictions', id: hoverRef.current, sourceLayer: "evictions" },
                  { hover: false }
                );
              }
              setTooltip({
                open: false,
              })
              hoverRef.current = null
            }}
            style={{width: '100vw', height: '100vh'}}
            interactiveLayerIds={["evictions"]}
            mapStyle={{
              version: 8,
              glyphs:'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
              sources: {
                sample: {
                  type: "vector",
                  url: "pmtiles://https://r2-public.protomaps.com/protomaps-sample-datasets/protomaps-basemap-opensource-20230408.pmtiles",
                  attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
                },
                evictions: {
                  promoteId: "id", 
                  type: "vector",
                  bounds: [-75.99361004232853, 35.66680309719159, -70.99361004232853, 45.66680309719159],
                  url: "pmtiles://evids.pmtiles",
                }
              },
              layers: [
                ...bmLayers,
                {
                  id: "evictions",
                  source: "evictions",
                  type: "circle",
                  "source-layer": "evictions",
                  "paint": {
                    "circle-color": "#FF0000",
                    "circle-opacity": 0.1,
                    "circle-radius": 5,
                  }
                },
                {
                  id: "evictions-hover",
                  source: "evictions",
                  type: "circle",
                  "source-layer": "evictions",
                  "paint": {
                    "circle-color": "#FF0000",
                    "circle-opacity": 1,
                    "circle-radius": [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      5,
                      0
                    ],
                  }
                }
              ]
            }}
          />
        </div>
      </Tooltip>
      <Cards />
    </main>
  )
}
