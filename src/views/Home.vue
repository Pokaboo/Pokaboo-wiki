<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
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
const router = useRouter();
const isDark = useDark();

/* ---------- 问候区 ---------- */
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 5) return '夜深了，注意休息';
  if (h < 9) return '早上好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const todayText = computed(() =>
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
);

const streakDays = computed(() => {
  const activeDates = [...new Set(store.notes.map(n => n.updatedAt.split('T')[0]))].sort().reverse();
  if (activeDates.length === 0) return 0;
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
  return streak;
});

/* ---------- 统计卡 ---------- */
const totalStudyHours = computed(() => {
  const totalMins = store.studyRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  return totalMins >= 60 ? Math.round(totalMins / 60) + 'h' : totalMins + 'min';
});

const newThisWeek = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return store.notes.filter(n => new Date(n.createdAt) >= oneWeekAgo).length;
});

const statCards = computed(() => [
  {
    label: '总笔记数',
    value: store.notes.length,
    unit: '篇',
    hint: '知识沉淀',
    icon: 'ri-book-open-line',
    tint: 'text-sky-600 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-400/10',
  },
  {
    label: '学习总时长',
    value: totalStudyHours.value,
    unit: '',
    hint: '坚持积累',
    icon: 'ri-time-line',
    tint: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/10',
  },
  {
    label: '当前连续',
    value: streakDays.value,
    unit: '天',
    hint: streakDays.value > 0 ? '继续保持' : '从今天开始',
    icon: 'ri-fire-line',
    tint: 'text-orange-600 dark:text-orange-300 bg-orange-500/10 dark:bg-orange-400/10',
  },
  {
    label: '本周新增',
    value: newThisWeek.value,
    unit: '篇',
    hint: '最近 7 天',
    icon: 'ri-calendar-line',
    tint: 'text-violet-600 dark:text-violet-300 bg-violet-500/10 dark:bg-violet-400/10',
  },
]);

/* ---------- 热力图（中性灰 + 强调紫，克制配色） ---------- */
const heatmapOption = computed(() => {
  const textColor = isDark.value ? '#9ca3af' : '#6b7280';
  const faintColor = isDark.value ? '#575757' : '#9ca3af';
  const cellBorder = isDark.value ? '#1f1f1f' : '#ffffff';
  // 0(空) → 少 → 多 五档
  const lightScale = ['#f3f3f1', '#e6e6fb', '#c1c5f7', '#8b90ee', '#5e6ad2'];
  const darkScale = ['#27272a', '#2b2c55', '#414596', '#7c83f2', '#a9aefc'];

  return {
    tooltip: {
      position: 'top',
      backgroundColor: isDark.value ? '#1f1f1f' : '#ffffff',
      borderColor: isDark.value ? '#3a3a3a' : '#e5e5e5',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: textColor, fontSize: 12 },
      formatter: function (p: any) {
        return p.data[1] > 0
          ? `<b>${p.data[0]}</b>　${p.data[1]} 篇笔记`
          : `<b>${p.data[0]}</b>　暂无更新`;
      },
    },
    visualMap: {
      min: 0,
      max: 4,
      calculable: false,
      show: false,
      inRange: {
        color: isDark.value ? darkScale : lightScale,
      },
    },
    calendar: [
      {
        top: 36,
        left: 40,
        right: 16,
        cellSize: ['auto', 15],
        range: new Date().getFullYear().toString(),
        itemStyle: {
          borderWidth: 4,
          borderColor: cellBorder,
          borderRadius: 4,
        },
        splitLine: { show: false },
        yearLabel: { show: false },
        dayLabel: {
          firstDay: 1,
          nameMap: ['日', '一', '二', '三', '四', '五', '六'],
          color: faintColor,
          fontSize: 10,
        },
        monthLabel: {
          nameMap: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          color: faintColor,
          fontSize: 10,
        },
      },
    ],
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: (() => {
          const dateMap: Record<string, number> = {};
          store.notes.forEach(note => {
            const createdDate = note.createdAt.split('T')[0];
            const updatedDate = note.updatedAt.split('T')[0];
            dateMap[createdDate] = (dateMap[createdDate] || 0) + 1;
            if (updatedDate !== createdDate) {
              dateMap[updatedDate] = (dateMap[updatedDate] || 0) + 1;
            }
          });
          const year = new Date().getFullYear();
          const start = new Date(`${year}-01-01`).getTime();
          const end = new Date(`${year + 1}-01-01`).getTime();
          const day = 3600 * 24 * 1000;
          const data: any[] = [];
          for (let t = start; t < end; t += day) {
            const dStr = new Date(t).toISOString().split('T')[0];
            const v = dateMap[dStr] || 0;
            data.push([dStr, Math.min(v, 4)]);
          }
          return data;
        })(),
      },
    ],
  };
});

const heatLegend = computed(() => {
  const light = ['bg-[#f3f3f1]', 'bg-[#e6e6fb]', 'bg-[#c1c5f7]', 'bg-[#8b90ee]', 'bg-[#5e6ad2]'];
  const dark = ['dark:bg-[#27272a]', 'dark:bg-[#2b2c55]', 'dark:bg-[#414596]', 'dark:bg-[#7c83f2]', 'dark:bg-[#a9aefc]'];
  return light.map((c, i) => c + ' ' + dark[i]);
});

/* ---------- 最近更新 ---------- */
const recentNotes = computed(() => store.notes.slice(0, 4));

function moduleNameOf(categoryId: string): string {
  const cat = store.categories.find(c => c.id === categoryId);
  if (!cat) return '未分类';
  const mod = store.modules.find(m => m.id === cat.moduleId);
  return mod?.name || '未分类';
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = 60_000, h = 3_600_000, d = 86_400_000;
  if (diff < m) return '刚刚更新';
  if (diff < h) return Math.floor(diff / m) + ' 分钟前';
  if (diff < d) return Math.floor(diff / h) + ' 小时前';
  if (diff < 7 * d) return Math.floor(diff / d) + ' 天前';
  return new Date(t).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

const openNote = (id: string) => router.push(`/note/${id}`);
</script>

<template>
  <div class="flex-1 h-full overflow-y-auto">
    <div class="max-w-5xl mx-auto px-6 lg:px-8 py-8 lg:py-10 space-y-8">

      <!-- ══ 标题区（Notion 式：无卡片、纯排版） ══ -->
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-1">
        <div class="space-y-1.5">
          <h1 class="font-display text-[26px] lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-tight">
            {{ greeting }}
          </h1>
          <p class="text-sm text-gray-400 dark:text-slate-500">
            {{ todayText }} · 保持记录，让知识持续生长
          </p>
        </div>
        <div
          class="flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-white dark:bg-[#1f1f1f] px-3.5 py-2"
        >
          <i class="ri-fire-line text-lg text-[var(--accent)]"></i>
          <div class="leading-none">
            <span class="font-display text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ streakDays }}</span>
            <span class="text-xs text-gray-400 dark:text-slate-500 ml-1">天连续学习</span>
          </div>
        </div>
      </div>

      <!-- ══ 统计卡组 ══ -->
      <section class="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="n-card n-card-hover p-5"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="stat.tint"
            >
              <i :class="[stat.icon, 'text-base']"></i>
            </div>
            <span class="text-xs text-gray-400 dark:text-slate-500">{{ stat.hint }}</span>
          </div>
          <div class="font-display text-2xl font-bold text-gray-900 dark:text-white leading-none tabular-nums">
            {{ stat.value }}
            <span v-if="stat.unit" class="text-xs font-normal text-gray-400 ml-0.5">{{ stat.unit }}</span>
          </div>
          <div class="text-[13px] text-gray-500 dark:text-slate-400 mt-1.5">{{ stat.label }}</div>
        </div>
      </section>

      <!-- ══ 学习贡献热力图 ══ -->
      <section v-if="store.notes.length > 0" class="n-card p-6">
        <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 class="font-display text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              学习足迹
            </h2>
            <p class="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{{ new Date().getFullYear() }} 年 · 全年笔记更新分布</p>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500">
            <span class="mr-1">少</span>
            <span
              v-for="(c, i) in heatLegend"
              :key="i"
              class="h-3 w-3 rounded-[3px]"
              :class="c"
            ></span>
            <span class="ml-1">多</span>
          </div>
        </div>
        <div class="h-[190px] w-full">
          <v-chart :option="heatmapOption" autoresize />
        </div>
      </section>

      <!-- ══ 空状态 ══ -->
      <section
        v-else-if="!store.loading"
        class="rounded-xl border border-dashed border-[var(--line-strong)] bg-white dark:bg-[#1f1f1f] px-8 py-16 text-center"
      >
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mb-4">
          <i class="ri-quill-pen-line text-2xl"></i>
        </div>
        <h3 class="font-display text-lg font-semibold text-gray-800 dark:text-gray-100">开始构建你的知识库</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
          在左侧点击「添加模块」创建第一个知识模块，分类并记录笔记后，
          这里将展示你的学习足迹与最近更新。
        </p>
      </section>

      <!-- ══ 最近更新 ══ -->
      <section v-if="recentNotes.length > 0">
        <div class="flex items-center justify-between mb-3 px-1">
          <h2 class="font-display text-[15px] font-semibold text-gray-900 dark:text-gray-100">最近更新</h2>
          <span class="text-xs text-gray-400 dark:text-slate-500">{{ store.notes.length }} 篇 · 按更新时间</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article
            v-for="(note, i) in recentNotes"
            :key="note.id"
            class="n-card n-card-hover group p-5 cursor-pointer"
            @click="openNote(note.id)"
            :style="{ animationDelay: i * 60 + 'ms' }"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-display text-[15px] font-medium text-gray-900 dark:text-gray-100 leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                {{ note.title }}
              </h3>
              <span class="shrink-0 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-medium px-2 py-0.5 whitespace-nowrap">
                {{ moduleNameOf(note.categoryId) }}
              </span>
            </div>

            <p class="text-[13px] text-gray-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
              {{ note.summary }}
            </p>

            <div class="flex items-center justify-between mt-3.5">
              <div class="flex items-center gap-1.5 overflow-hidden">
                <span
                  v-for="tag in note.tags.slice(0, 2)"
                  :key="tag"
                  class="shrink-0 rounded-md bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[11px] text-gray-500 dark:text-slate-400"
                >
                  #{{ tag }}
                </span>
              </div>
              <span class="text-[11px] text-gray-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
                <i class="ri-time-line"></i>{{ relTime(note.updatedAt) }}
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 入场动画：卡片依次淡入上移 */
article {
  animation: rise-in 0.4s ease both;
}
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
