<script setup lang="ts">
import { computed } from 'vue';
import { useWikiStore } from '../store';
// @ts-ignore
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { HeatmapChart } from 'echarts/charts';
import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { useDark } from '@vueuse/core';

use([CanvasRenderer, HeatmapChart, CalendarComponent, TooltipComponent, VisualMapComponent]);

const store = useWikiStore();
const isDark = useDark();

const totalStudyHours = computed(() => {
  const totalMins = store.studyRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  return Math.round(totalMins / 60) + 'h';
});

const currentStreak = computed(() => {
  const activeDates = [...new Set(store.notes.map(n => n.updatedAt.split('T')[0]))].sort().reverse();
  if (activeDates.length === 0) return '0天';
  
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < 365; i++) {
    const dStr = currentDate.toISOString().split('T')[0];
    if (activeDates.includes(dStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      if (i === 0) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  return streak + '天';
});

const newThisWeek = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return store.notes.filter(n => new Date(n.createdAt) >= oneWeekAgo).length + '篇';
});

const stats = computed(() => [
  { label: '总笔记数', value: store.notes.length, icon: 'ri-book-open-line', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: '学习总时长', value: totalStudyHours.value, icon: 'ri-time-line', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: '当前连续', value: currentStreak.value, icon: 'ri-fire-line', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { label: '本周新增', value: newThisWeek.value, icon: 'ri-calendar-line', color: 'text-purple-500', bg: 'bg-purple-500/10' },
]);

// Generate real data for heatmap
const getRealHeatmapData = (year: string) => {
  const dateMap: Record<string, number> = {};
  
  store.notes.forEach(note => {
    const createdDate = note.createdAt.split('T')[0];
    const updatedDate = note.updatedAt.split('T')[0];
    
    if (createdDate.startsWith(year)) {
      dateMap[createdDate] = (dateMap[createdDate] || 0) + 1;
    }
    if (updatedDate !== createdDate && updatedDate.startsWith(year)) {
      dateMap[updatedDate] = (dateMap[updatedDate] || 0) + 1;
    }
  });

  const date = +use.echarts?.number?.parseDate(year + '-01-01') || +new Date(year + '-01-01');
  const end = +use.echarts?.number?.parseDate(+year + 1 + '-01-01') || +new Date(+year + 1 + '-01-01');
  const dayTime = 3600 * 24 * 1000;
  const data = [];
  
  for (let time = date; time < end; time += dayTime) {
    const dStr = new Date(time).toISOString().split('T')[0];
    data.push([
      dStr,
      dateMap[dStr] || 0
    ]);
  }
  return data;
};

const heatmapOption = computed(() => {
  const textColor = isDark.value ? '#e5e7eb' : '#374151';
  const splitLineColor = isDark.value ? '#374151' : '#e5e7eb';
  const itemBorderColor = isDark.value ? '#111827' : '#ffffff';
  
  return {
    tooltip: {
      position: 'top',
      formatter: function (p: any) {
        const format = use.echarts?.time?.format || ((d: any, f: any) => p.data[0]);
        return format(p.data[0], '{yyyy}-{MM}-{dd}', false) + ': ' + p.data[1] + ' 篇笔记';
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemWidth: 12,
      itemHeight: 12,
      inRange: {
        color: isDark.value 
          ? ['#1f2937', '#0e4429', '#006d32', '#26a641', '#39d353'] // Github Dark
          : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] // Github Light
      },
      textStyle: { color: textColor },
      show: false // Hide legend to match github style more closely
    },
    calendar: [
      {
        top: 30,
        left: 30,
        right: 30,
        cellSize: ['auto', 14],
        range: '2026', // Current year
        itemStyle: {
          borderWidth: 3,
          borderColor: itemBorderColor,
          borderRadius: 2
        },
        splitLine: {
          show: false
        },
        yearLabel: { show: false },
        dayLabel: {
          firstDay: 1,
          nameMap: ['日', '一', '二', '三', '四', '五', '六'],
          color: textColor,
          fontSize: 10
        },
        monthLabel: {
          nameMap: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          color: textColor,
          fontSize: 10
        }
      }
    ],
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: getRealHeatmapData(new Date().getFullYear().toString())
      }
    ]
  };
});
</script>

<template>
  <div class="flex-1 h-full overflow-y-auto bg-white dark:bg-gray-950 p-8">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2 text-gray-900 dark:text-gray-100">Try harder!</h1>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          v-for="stat in stats" 
          :key="stat.label"
          class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur shadow-sm transition-transform hover:-translate-y-1"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.label }}</span>
            <div :class="['p-2 rounded-lg flex items-center justify-center', stat.bg, stat.color]">
              <i :class="[stat.icon, 'text-base']"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stat.value }}</div>
        </div>
      </div>

      <!-- Heatmap -->
      <div class="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur shadow-sm">
        <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">学习贡献图</h2>
        <div class="h-48 w-full -ml-4">
          <v-chart class="chart" :option="heatmapOption" autoresize />
        </div>
      </div>
      
      <!-- Recent Notes -->
      <div>
        <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">最近更新</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="note in store.notes.slice(0,4)" 
            :key="note.id"
            class="group p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            @click="$router.push(`/note/${note.id}`)"
          >
            <h3 class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-500 transition-colors mb-1 truncate">{{ note.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate mb-3">{{ note.summary }}</p>
            <div class="flex items-center gap-2">
              <span 
                v-for="tag in note.tags" 
                :key="tag"
                class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
