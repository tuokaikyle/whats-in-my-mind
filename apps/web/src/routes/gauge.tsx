import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@/components/theme-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute('/gauge')({
  component: GaugePage,
});

function GaugePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const textColor = isDark ? '#f5f5f5' : '#171717';

  const options: Highcharts.Options = {
    chart: {
      type: 'gauge',
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
      },
    },
    title: {
      text: 'Default look',
      style: { color: textColor },
    },
    pane: {
      startAngle: -90,
      endAngle: 90,
      borderRadius: '50%',
      background: null,
    } as unknown as Highcharts.PaneOptions,
    yAxis: {
      min: 0,
      max: 100,
      plotBands: [
        { from: 0, to: 50, color: '#55BF3B' },
        { from: 50, to: 75, color: '#DDDF0D' },
        { from: 75, to: 100, color: '#DF5353' },
      ],
    },
    series: [
      {
        name: 'Score',
        data: [68],
        tooltip: { valueSuffix: ' / 100' },
      } as Highcharts.SeriesOptionsType,
    ],
    credits: { enabled: false },
  };

  return (
    <div className='mx-auto w-full max-w-md py-10'>
      <Card>
        <CardHeader>
          <CardTitle>Gauge</CardTitle>
          <CardDescription>Score gauge</CardDescription>
        </CardHeader>
        <CardContent>
          <HighchartsReact highcharts={Highcharts} options={options} />
        </CardContent>
      </Card>
    </div>
  );
}
