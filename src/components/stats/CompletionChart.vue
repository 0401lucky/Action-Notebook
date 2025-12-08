<template>
  <div ref="chartRef" class="completion-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { TrendPoint } from '@/types'

interface Props {
  data: TrendPoint[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '完成率趋势'
})

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance) return
  const dates = props.data.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const rates = props.data.map(d => d.rate)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: (params: any) => {
        const p = params[0]
        return `
          <div style="font-weight: bold; margin-bottom: 4px;">${p.name}</div>
          <div style="display: flex; align-items: center;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${p.color}; margin-right: 6px;"></span>
            完成率: <span style="font-weight: bold; margin-left: 4px;">${p.value}%</span>
          </div>
        `
      }
    },
    grid: {
      left: '2%',
      right: '4%',
      bottom: '5%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 11,
        interval: 'auto'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.05)',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#999',
        formatter: '{value}%'
      }
    },
    series: [
      {
        data: rates,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#6366f1',
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: 'rgba(99, 102, 241, 0.3)',
          shadowBlur: 5
        },
        lineStyle: {
          width: 3,
          color: '#6366f1',
          shadowColor: 'rgba(99, 102, 241, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(99, 102, 241, 0.4)'
            },
            {
              offset: 1,
              color: 'rgba(99, 102, 241, 0.0)'
            }
          ])
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(() => props.data, updateChart, { deep: true })
</script>

<style scoped>
.completion-chart {
  width: 100%;
  height: 300px;
}
</style>
