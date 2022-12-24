import './App.css';
import React, { useRef, useState } from 'react';
// Import Highcharts
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exporting from 'highcharts/modules/exporting';
import highchartsMore from 'highcharts/highcharts-more';
exporting(Highcharts);
highchartsMore(Highcharts);

function App() {
  // const [hoverData, setHoverData] = useState(null);
  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: 'packedbubble',
      height: '100%',
    },
    title: {
      text: "What's in my mind?",
    },
    tooltip: {
      useHTML: true,
      pointFormat: '<b>{point.name}:</b> {point.value}',
    },
    plotOptions: {
      packedbubble: {
        minSize: '30%',
        maxSize: '100%',
        //zMin: 0,
        //zMax: 1000,
        layoutAlgorithm: {
          splitSeries: false,
          gravitationalConstant: 0.02,
        },
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          filter: {
            property: 'y',
            operator: '<',
            value: 99,
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
        name: '车',
        data: [
          {
            name: '买车',
            value: 21,
          },
          {
            name: '学车',
            value: 13,
          },
        ],
      },
      {
        name: '学法语',
        data: [
          {
            name: '学法语',
            value: 21,
          },
        ],
      },
      {
        name: '找女朋友',
        data: [
          {
            name: '找女朋友',
            value: 33,
          },
        ],
      },
      {
        name: '学习 ',
        data: [
          {
            name: 'Docker',
            value: 1,
          },
          {
            name: 'K8S',
            value: 2,
          },
          {
            name: 'Pytorch',
            value: 8,
          },
          {
            name: '微积分',
            value: 13,
          },
          {
            name: '线性代数',
            value: 13,
          },
          {
            name: 'Graph',
            value: 8,
          },
        ],
      },
    ],
  });
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  return (
    <div className='App'>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'chart'}
        options={chartOptions}
        ref={chartComponentRef}
      />
    </div>
  );
}

export default App;
