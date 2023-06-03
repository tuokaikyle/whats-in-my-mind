import './App.css';
import React, { useEffect, useRef, useState } from 'react';
// Import Highcharts
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exporting from 'highcharts/modules/exporting';
import highchartsMore from 'highcharts/highcharts-more';
exporting(Highcharts);
highchartsMore(Highcharts);

type Card = { id: string; name: string; closed: boolean };
type Column = { id: string; name: string; cards: Card[] }[] | null;
const c = {
  blue: '#2caffe',
  darkPurple: '#544fc5',
  green: '#00e272',
  orange: '#fe6a35',
  iron: '#6b8abc',
  purple: '#d568fb',
  tiffany: '#2ee0ca',
  red: '#fa4b42',
  lightOrange: '#feb56a',
  lightGreen: '#91e8e1',
};
const pallete = [c.blue, c.lightOrange, c.orange, c.purple, c.tiffany];

function App() {
  const [board, setBoard] = useState<Column>(null);
  useEffect(() => {
    const fetchData = async () => {
      const apiKey = import.meta.env.VITE_APIKEY;
      const token = import.meta.env.VITE_TOKEN;
      const boardId = import.meta.env.VITE_BOARD;

      try {
        fetch(
          `https://api.trello.com/1/boards/${boardId}/lists?cards=all&key=${apiKey}&token=${token}`
        )
          .then((res) => res.json())
          .then((res) => {
            setBoard(res);
          });
      } catch (error) {
        console.error('Error fetching Trello board data:', error);
      }
    };
    fetchData();
  }, []);

  const series = board
    ?.filter((col) => col.name != 'Done')
    .map((col, idx) => ({
      name: col.name,
      data: col.cards
        .filter((card) => card.closed == false)
        .map((card) => ({
          name: card.name,
          value: board.length - idx,
          color: pallete[idx],
        })),
    }));

  const chartOptions = {
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
        minSize: '50%',
        maxSize: '100%',
        //zMin: 0,
        //zMax: 1000,
        layoutAlgorithm: {
          splitSeries: false,
          gravitationalConstant: 0.03,
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
    series,
  };
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  return (
    <div className='App'>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'chart'}
        options={chartOptions}
        containerProps={{ style: { width: '800px' } }}
        ref={chartComponentRef}
      />
    </div>
  );
}

export default App;
