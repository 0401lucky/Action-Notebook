<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { MoodCount } from '@/types'

interface Props {
  data: MoodCount[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '心情分布'
})

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const moodConfig: Record<string, { name: string; color: string; emoji: string }> = {
  happy: { name: '开心', color: '#fbbf24', emoji: '😊' },
  neutral: { name: '平淡', color: '#9ca3af', emoji: '😐' },
  sad: { name: '沮丧', color: '#60a5fa', emoji: '😢' },
  excited: { name: '兴奋', color: '#f87171', emoji: '🎉' },
  tired: { name: '疲惫', color: '#a78bfa', emoji: '😴' }
}

function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance) return

  const pieData = props.data.map(item => ({
    name: moodConfig[item.mood]?.name || item.mood,
    value: item.count,
    itemStyle: {
      color: moodConfig[item.mood]?.color || '#999',
      shadowBlur: 10,
      shadowColor: 'rgba(0, 0, 0, 0.1)'
    }
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: (params: any) => {
        return `
          <div style="display: flex; align-items: center;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${params.color}; margin-right: 6px;"></span>
            ${params.name}: <span style="font-weight: bold; margin-left: 4px;">${params.value} 天</span>
            <span style="color: #999; margin-left: 4px;">(${params.percent}%)</span>
          </div>
        `
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: '#666',
        fontSize: 12
      }
    },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        scale: true,
        scaleSize: 10
      },
      labelLine: {
        show: false
      },
      data: pieData
    }]
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

<template>
  <div ref="chartRef" class="mood-chart"></div>
</template>

<style scoped>
.mood-chart {
  width: 100%;
  height: 300px;
}
</style>
