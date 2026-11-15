import { deflateSync } from "node:zlib";
import type { PlanEntrySummary } from "@/server/planEntries";

const MAX_WIDGET_HTML_BYTES = 28_000;
const MAX_WIDGET_COMPRESSED_BYTES = 3_700;
const MAX_WIDGET_STATE_BYTES = 1_024;
const MAX_PLAN_ENTRIES_IN_STATE = 3;
const MAX_TASK_LENGTH = 180;
const MAX_COMMENT_LENGTH = 120;

export const CALENDAR_WIDGET_REQUEST_PREFIXES = {
  month: "month:",
  date: "date:",
} as const;

export type CalendarPlanEntry = {
  sessionOrder: number;
  taskText: string;
  commentText: string | null;
  isWorkload: boolean;
};

export type CalendarWidgetState = {
  month: string;
  planDates: string[];
  selectedDate: string | null;
  planEntries: CalendarPlanEntry[];
  notice: string | null;
};

export type CalendarWidgetPayload = {
  chat_id: number;
  html: string;
  chat_data: string;
  caption: string;
  allow_queries: true;
  height: number;
};

const truncateText = (value: string, maxLength: number) => {
  const normalized = value.trim();
  if (Array.from(normalized).length <= maxLength) {
    return normalized;
  }

  return `${Array.from(normalized)
    .slice(0, maxLength - 1)
    .join("")}…`;
};

const normalizePlanEntry = (entry: PlanEntrySummary): CalendarPlanEntry => ({
  sessionOrder: entry.sessionOrder,
  taskText: truncateText(entry.taskText, MAX_TASK_LENGTH),
  commentText: entry.commentText ? truncateText(entry.commentText, MAX_COMMENT_LENGTH) : null,
  isWorkload: entry.isWorkload,
});

const getMonthBounds = (month: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999 ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return null;
  }

  return { year, monthNumber };
};

export const isValidCalendarMonth = (month: string) => Boolean(getMonthBounds(month));

export const isValidCalendarDate = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = new Date(Date.UTC(year, month - 1, day));
  return (
    Number.isInteger(year) &&
    year >= 1000 &&
    year <= 9999 &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 &&
    value.getUTCDate() === day
  );
};

const getMonthLabel = (month: string) => {
  const bounds = getMonthBounds(month);
  if (!bounds) {
    return month;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(bounds.year, bounds.monthNumber - 1, 1)));
};

export const createCalendarWidgetState = (params: {
  month: string;
  planDates: string[];
  selectedDate?: string | null;
  planEntries?: PlanEntrySummary[];
  notice?: string | null;
}): CalendarWidgetState => ({
  month: params.month,
  planDates: params.planDates,
  selectedDate: params.selectedDate ?? null,
  planEntries: (params.planEntries ?? [])
    .slice(0, MAX_PLAN_ENTRIES_IN_STATE)
    .map(normalizePlanEntry),
  notice: params.notice ?? null,
});

export const serializeCalendarWidgetState = (state: CalendarWidgetState) => {
  const serialized = JSON.stringify(state);
  if (Buffer.byteLength(serialized, "utf8") > MAX_WIDGET_STATE_BYTES) {
    return null;
  }

  return serialized;
};

export const shouldSendCalendarPlanText = (entries: PlanEntrySummary[]) =>
  entries.length > MAX_PLAN_ENTRIES_IN_STATE ||
  entries.some(
    (entry) =>
      Array.from(entry.taskText.trim()).length > MAX_TASK_LENGTH ||
      Array.from(entry.commentText?.trim() ?? "").length > MAX_COMMENT_LENGTH
  );

const escapeScriptData = (value: string) =>
  value
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const buildWidgetHtml = (initialState: CalendarWidgetState) => {
  const initialStateScript = escapeScriptData(JSON.stringify(initialState));
  const html = [
    "<style>",
    ":root{color-scheme:light dark;--bg:var(--tg-theme-bg-color,#212121);--surface:var(--tg-theme-secondary-bg-color,#292929);--text:var(--tg-theme-text-color,#f5f5f5);--muted:var(--tg-theme-hint-color,#b8b8b8);--accent:var(--tg-theme-button-color,#3a3a3a);--accentText:var(--tg-theme-button-text-color,#f5f5f5);--border:var(--tg-theme-section-separator-color,#3a3a3a);--link:var(--tg-theme-link-color,#d0d0d0)}",
    "body{margin:0;padding:12px 14px 14px;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,sans-serif}",
    ".calendar{border:1px solid var(--border);border-radius:6px;background:var(--surface);overflow:hidden}",
    ".head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--border)}",
    ".title{margin:0;text-transform:capitalize;font-size:1.05em;font-weight:600}",
    "button{font:inherit;color:var(--text);border:1px solid var(--border);border-radius:4px;background:var(--surface);cursor:pointer;touch-action:none}",
    "button:active{background:var(--accent);color:var(--accentText)}",
    ".nav{width:34px;height:34px;font-size:1.25em;line-height:1}",
    ".week,.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;padding:8px 10px 0}",
    ".week{color:var(--muted);font-size:.78em;text-align:center;padding-bottom:2px}",
    ".day{position:relative;min-height:38px;padding:4px 2px 11px;border-color:transparent;background:transparent;text-align:center}",
    ".day.muted{color:var(--muted)}",
    ".day.selected{border-color:var(--link);outline:2px solid var(--link);outline-offset:-2px}",
    ".day.has-plan{font-weight:700}",
    ".dot{position:absolute;right:50%;bottom:4px;width:5px;height:5px;border-radius:50%;background:var(--link);transform:translateX(50%)}",
    ".legend{display:flex;align-items:center;gap:6px;margin:8px 12px 0;color:var(--muted);font-size:.78em}",
    ".legend .dot{position:static;display:inline-block;transform:none;flex:none}",
    ".result{margin:10px 12px 12px;padding-top:10px;border-top:1px solid var(--border)}",
    ".result h2{margin:0 0 6px;font-size:.95em}",
    ".result p{margin:5px 0;color:var(--muted);overflow-wrap:anywhere}",
    ".entry{padding:8px 0;border-top:1px solid var(--border)}",
    ".entry strong{display:block;margin-bottom:3px}",
    ".workload{display:inline-block;margin-left:4px;padding:1px 5px;border:1px solid var(--border);border-radius:3px;color:var(--muted);font-size:.75em;font-weight:500}",
    ".status{min-height:1.3em;margin:8px 12px 0;color:var(--muted);font-size:.8em}",
    "</style>",
    '<main class="calendar" aria-label="Календарь тренировочного плана">',
    '<header class="head"><button class="nav" data-action="previous" aria-label="Предыдущий месяц">‹</button><h1 class="title" id="month"></h1><button class="nav" data-action="next" aria-label="Следующий месяц">›</button></header>',
    '<div class="week" aria-hidden="true"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>',
    '<div class="grid" id="days"></div>',
    '<div class="legend"><span class="dot"></span><span>Есть тренировка</span></div>',
    '<div class="status" id="status" aria-live="polite"></div>',
    '<section class="result" id="result" aria-live="polite"></section>',
    "</main>",
    "<script>",
    `const INITIAL_STATE=${initialStateScript};const TW=window.TelegramWidget;let state=INITIAL_STATE;let busy=false;const $=id=>document.getElementById(id);const monthKey=(y,m)=>String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0');const dateKey=(month,day)=>month+'-'+String(day).padStart(2,'0');const shiftMonth=(month,delta)=>{const [y,m]=month.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));return monthKey(d.getUTCFullYear(),d.getUTCMonth()+1)};const monthTitle=month=>{const [y,m]=month.split('-').map(Number);return new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1)))};const dayCount=month=>{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate()};const firstOffset=month=>{const [y,m]=month.split('-').map(Number);return (new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7};const formatDate=date=>{const [y,m,d]=date.split('-');return d+'-'+m+'-'+y};const parseResult=result=>{try{return JSON.parse(result||'{}')}catch{return null}};const showPlan=()=>{const result=$('result');result.replaceChildren();if(state.selectedDate){const heading=document.createElement('h2');heading.textContent='План на '+formatDate(state.selectedDate);result.append(heading)}if(state.planEntries.length){state.planEntries.forEach(entry=>{const block=document.createElement('div');block.className='entry';const title=document.createElement('strong');title.textContent=entry.sessionOrder+'. '+entry.taskText;if(entry.isWorkload){const badge=document.createElement('span');badge.className='workload';badge.textContent='Нагрузка';title.append(' ',badge)}block.append(title);if(entry.commentText){const comment=document.createElement('p');comment.textContent=entry.commentText;block.append(comment)}result.append(block)})}else if(state.selectedDate){const empty=document.createElement('p');empty.textContent=state.notice||'На эту дату тренировка не запланирована.';result.append(empty)}};const draw=()=>{ $('month').textContent=monthTitle(state.month);const days=$('days');days.replaceChildren();const planned=new Set(state.planDates);const offset=firstOffset(state.month);for(let i=0;i<offset;i++){const empty=document.createElement('span');empty.className='day muted';days.append(empty)}for(let day=1;day<=dayCount(state.month);day++){const date=dateKey(state.month,day);const button=document.createElement('button');button.className='day'+(planned.has(date)?' has-plan':'')+(state.selectedDate===date?' selected':'');button.dataset.action='date';button.dataset.date=date;button.setAttribute('aria-label',formatDate(date)+(planned.has(date)?' — есть тренировка':''));button.textContent=String(day);if(planned.has(date)){const dot=document.createElement('span');dot.className='dot';dot.setAttribute('aria-hidden','true');button.append(dot)}days.append(button)}while(days.children.length%7){const empty=document.createElement('span');empty.className='day muted';days.append(empty)}showPlan()};const apply=(next,notice)=>{if(!next||!next.month)return;state={...state,...next,notice:notice??next.notice??null};draw()};const request=data=>{if(!TW||busy)return;busy=true;$('status').textContent='Загрузка…';TW.request(data).then(response=>{const next=parseResult(response&&response.result);if(next&&next.month){apply(next)}else if(next&&next.notice){$('status').textContent=next.notice}else{$('status').textContent='Не удалось обновить календарь.'}},error=>{$('status').textContent=error&&error.code==='RATE_LIMITED'?'Слишком много запросов. Попробуйте ещё раз.':'Не удалось обновить календарь.'}).finally(()=>{busy=false;if(!$('status').textContent||$('status').textContent==='Загрузка…')$('status').textContent=''})};document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target:null;const button=target?.closest('button[data-action]');if(!button||busy)return;const action=button.dataset.action;if(action==='previous'||action==='next'){request('month:'+shiftMonth(state.month,action==='next'?1:-1));return}if(action==='date'&&button.dataset.date){request('date:'+button.dataset.date)}});if(TW){TW.onEvent('chatDataChanged',()=>{try{const next=JSON.parse(TW.chatData||'{}');if(next.month)apply(next)}catch{}})}draw();if(TW&&typeof TW.ready==='function')TW.ready();`,
    "</script>",
  ].join("");

  return html;
};

export const buildPlanCalendarWidgetPayload = (params: {
  chatId: number;
  month: string;
  planDates: string[];
}): CalendarWidgetPayload | null => {
  const state = createCalendarWidgetState({ month: params.month, planDates: params.planDates });
  const chatData = serializeCalendarWidgetState(state);
  if (!chatData) {
    return null;
  }

  const html = buildWidgetHtml(state);
  const htmlBytes = Buffer.byteLength(html, "utf8");
  const compressedBytes = deflateSync(Buffer.from(html, "utf8"), { level: 9 }).byteLength;
  if (htmlBytes > MAX_WIDGET_HTML_BYTES || compressedBytes > MAX_WIDGET_COMPRESSED_BYTES) {
    return null;
  }

  return {
    chat_id: params.chatId,
    html,
    chat_data: chatData,
    caption: `Выбор даты для тренировочного плана · ${getMonthLabel(params.month)}`,
    allow_queries: true,
    height: 520,
  };
};

export const buildCalendarQueryResponse = (state: CalendarWidgetState) => {
  const response = JSON.stringify(state);
  if (Buffer.byteLength(response, "utf8") <= MAX_WIDGET_STATE_BYTES) {
    return response;
  }

  const fallback = {
    ...state,
    planEntries: [],
    notice:
      "План слишком большой для отображения в виджете. Он будет отправлен отдельным сообщением.",
  } satisfies CalendarWidgetState;
  return JSON.stringify(fallback);
};
