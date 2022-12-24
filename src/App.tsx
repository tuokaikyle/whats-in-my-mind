import './App.css';
import React, { useRef, useState } from 'react';
// Import Highcharts
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exporting from 'highcharts/modules/exporting';
import highchartsMore from 'highcharts/highcharts-more';
exporting(Highcharts);
highchartsMore(Highcharts);
// Load Highcharts modules
// require('highcharts/modules/exporting')(Highcharts);
// require('highcharts/highcharts-more')(Highcharts);

function App() {
  // const [hoverData, setHoverData] = useState(null);
  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: 'packedbubble',
      height: '100%',
    },
    title: {
      text: 'TOP Contributors to Cycle Time MTM Decrease',
    },
    tooltip: {
      useHTML: true,
      pointFormat: '<b>{point.name}:</b> {point.value}',
    },
    plotOptions: {
      packedbubble: {
        minSize: '30%',
        maxSize: '80%',
        //zMin: 0,
        //zMax: 1000,
        layoutAlgorithm: {
          splitSeries: false,
          gravitationalConstant: 0.02,
        },
        dataLabels: {
          enabled: true,
          format: '{series.name}',
          filter: {
            property: 'y',
            operator: '>',
            value: 250,
          },
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
        },
      },
    },
    series: [
      {
        name: 'ASEAN',
        data: [
          {
            name: 'ASEAN',
            value: -88.2,
          },
        ],
      },
      {
        name: 'KOR ',
        data: [
          {
            name: 'KOR',
            value: -605.2,
          },
        ],
      },
      {
        name: 'CHN ',
        data: [
          {
            name: 'CHN',
            value: -427233.7,
          },
        ],
      },
      {
        name: 'ISA ',
        data: [
          {
            name: 'ISA',
            value: -355.39,
          },
        ],
      },
      {
        name: 'ANZ ',
        data: [
          {
            name: 'ANZ ',
            value: -3331.4,
          },
        ],
      },
      {
        name: 'JP ',
        data: [
          {
            name: 'JP1',
            value: -22470857.0,
          },
          {
            name: 'JP2',
            value: -21470857.0,
          },
        ],
      },
    ],
  });
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  return (
    <div className='App'>
      <h2>What's in my Mind?</h2>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'chart'}
        options={chartOptions}
        ref={chartComponentRef}
      />
      {/* <button onClick={()}>Export</button> */}
    </div>
  );
}

export default App;
