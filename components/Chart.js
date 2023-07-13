import { Button, Sheet, Typography } from "@mui/joy";
import { animated, useSpring } from "@react-spring/web";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import * as d3 from "d3";
import { ParentSize } from "@visx/responsive";
import { useStore } from "@/app/page";

const margin = {
    top: 1,
    left: 43,
    right: 3,
    bottom: 32
}

function Histogram({ width, height }) {
  const [isOpen, { "Executed Date": hoverDate }] = useStore(
    (state) => [state.open, state.title],
  )

  const [evictions, setEvictions] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const evs = await d3.json(
        "https://data.cityofnewyork.us/resource/6z8x-wfk4.json?$query=SELECT%20%60executed_date%60%20LIMIT%2080000"
      );

      function thresholdTime(n) {
        return (_, min, max) => {
          return d3.scaleTime().domain([min, max]).ticks(n);
        };
      }

      const ticks = d3.timeMonth.count(
        new Date(d3.min(evs.map((d) => d.executed_date))),
        new Date()
      );

      const bins = d3
        .bin()
        .value((d) => new Date(d.executed_date))
        .thresholds(thresholdTime(ticks))(evs);
      setEvictions(bins);
    };
    getData();
  }, []);

  // scales, memoize for performance
  const xScale = useMemo(
    () =>
      scaleTime({
        range: [margin.left, width - margin.right],
        round: true,
        domain: [evictions[0]?.x0, evictions[evictions?.length - 1]?.x1]
      }),
    [evictions, width]
  );

  const yScale = useMemo(() => {
    const maxBins = d3.max(evictions, (d) => d.length);
    return scaleLinear({
      range: [height - margin.bottom, margin.top],
      domain: [0, maxBins]
    });
  }, [evictions, height]);

  const barWidth = !evictions.length ? 0 : Math.max(0, xScale(evictions[0].x1) - xScale(evictions[0].x0));

  return width < 10 ? null : (
    <svg width={width} height={height}>
      <GridRows
        scale={yScale}
        width={width - margin.left - margin.right}
        left={margin.left}
        top={margin.top}
      />
      <Group top={margin.top}>
        {evictions.map((d) => {
        //   const barWidth = Math.max(0, xScale(d.x1) - xScale(d.x0));
          const barHeight = yScale(0) - (yScale(d.length) ?? 0);
          const barX = xScale(d.x0);
          const barY = yScale(d.length);
          return (
            <Bar
              key={`bar-${d.x0}`}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill="#eb4574"
            />
          );
        })}
        {isOpen && (
            <Bar
                key={`bar-hover`}
                x={xScale(new Date(hoverDate))}
                y={margin.top}
                width={2}
                height={yScale(0) - margin.top}
                fill="black"
                style={{
                    mixBlendMode: "overlay"
                }}
            />
        )}
      </Group>
      <AxisBottom
        top={height - margin.bottom}
        scale={xScale}
        tickStroke={"#ddd"}
        hideAxisLine
        label="Month"
        labelClassName="fill-slate-500"
        tickLabelProps={{
            className: "fill-slate-500"
        }}
        tickLineProps={{
            className: "stroke-slate-500"
        }}
        tickLength={3}
      />
      <AxisLeft
        top={margin.top}
        left={margin.left}
        scale={yScale}
        hideAxisLine
        hideTicks
        label="Evictions"
        labelOffset={32}
        labelClassName="fill-slate-500"
        tickLabelProps={{
            className: "fill-slate-500"
        }}
        tickLength={3}
      />
    </svg>
  );
}


export default function Chart(props) {
    const [isOpen, setIsOpen] = useState(true)
    const chartSpring = useSpring({
        to: {
            x: isOpen ? 0 : 400
        }
    })
    const buttonSpring = useSpring({
        to: {
            x: isOpen ? 150 : 0
        }
    })

    return (
        <div className="absolute bottom-0 right-0">
            <animated.div style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                ...chartSpring
            }}>
                <Sheet sx={{
                    width: "375px",
                    height: "250px",
                    backgroundColor: "white",
                    padding: "12px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <Typography level="body2" className="text-slate-600" sx={{ marginBottom: "8px" }}>Evictions over time</Typography>
                    <button onClick={() => setIsOpen(false)} className="absolute -top-1.5 -right-1.5 w-[20px] min-w-0 min-h-0 h-[20px] rounded-full p-0 bg-white drop-shadow">
                        <span className='absolute top-1/2 left-1/2 w-[10px] h-[1px] bg-slate-400 -translate-x-1/2 -translate-y-1/2 rotate-45 origin-center'></span>
                        <span className='absolute top-1/2 left-1/2 w-[10px] h-[1px] bg-slate-400 -translate-x-1/2 -translate-y-1/2 -rotate-45 origin-center'></span>
                    </button>
                    <div className="grow w-full border-slate-100">
                        <ParentSize>{({ width, height }) => <Histogram width={width} height={height} />}</ParentSize>
                    </div>
                </Sheet>
            </animated.div>
            <animated.div onClick={() => setIsOpen(true)} style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                ...buttonSpring
            }}>
                <Button variant="soft" color="neutral" sx={{backgroundColor: "white !important", width: 120}}>Open Chart</Button>
            </animated.div>
        </div>
    )
}