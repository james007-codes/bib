import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, AreaChart, Area, Legend,
} from "recharts";

import { COLORS } from "../../styles/tokens.js";
import { shortDay } from "../../utils/format.js";

// Categorical order (validated adjacent-pair palette). "Other" is always neutral gray.
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
export const OTHER = "#94A3B8";

const axis = { fontSize: 12, fill: COLORS.slate };
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: `1px solid ${COLORS.line}`, fontSize: 12, boxShadow: "0 4px 12px rgba(15,23,42,.08)" },
  cursor: { fill: "rgba(99,102,241,0.06)" },
};

/* =========================
   HORIZONTAL BARS — one series, label on the axis carries identity.
   data: [{ name, value, color? }]  (color only for ordinal sets like priority)
========================= */

export function HBarChart({ data, color = COLORS.primary, valueLabel = "Complaints", height }) {
  const h = height || Math.max(160, data.length * 34 + 30);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={6}>
        <CartesianGrid horizontal={false} stroke={COLORS.line} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={150} interval={0} />
        <Tooltip {...tooltipStyle} formatter={(v) => [v, valueLabel]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: "right", fontSize: 11, fill: COLORS.slate }}>
          {data.map((d) => <Cell key={d.name} fill={d.color || color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* =========================
   TREND — complaints per day
========================= */

export function TrendChart({ data, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.18} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDay} tick={axis} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle.contentStyle}
          cursor={{ stroke: COLORS.slate, strokeDasharray: "3 3" }}
          labelFormatter={shortDay}
          formatter={(v) => [v, "Complaints"]}
        />
        <Area type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2} fill="url(#trendFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* =========================
   STACKED — top rooms × flair
   matrix: [{ roomId, roomName, flair, label, count }]
   Top 5 flairs get categorical slots; the rest fold into "Other".
========================= */

export function RoomFlairChart({ matrix, rooms = 8, flairs = 5 }) {
  const roomTotals = {};
  const flairTotals = {};
  matrix.forEach((m) => {
    roomTotals[m.roomName] = (roomTotals[m.roomName] || 0) + m.count;
    flairTotals[m.flair] = (flairTotals[m.flair] || 0) + m.count;
  });

  const topRooms = Object.entries(roomTotals).sort((a, b) => b[1] - a[1]).slice(0, rooms).map(([r]) => r);
  const topFlairs = Object.entries(flairTotals).sort((a, b) => b[1] - a[1]).slice(0, flairs).map(([f]) => f);
  const labelOf = Object.fromEntries(matrix.map((m) => [m.flair, m.label]));
  const hasOther = Object.keys(flairTotals).length > topFlairs.length;

  const data = topRooms.map((room) => {
    const row = { room };
    matrix.filter((m) => m.roomName === room).forEach((m) => {
      const key = topFlairs.includes(m.flair) ? m.flair : "other";
      row[key] = (row[key] || 0) + m.count;
    });
    return row;
  });

  const keys = [...topFlairs, ...(hasOther ? ["other"] : [])];

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, topRooms.length * 38 + 60)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={COLORS.line} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="room" tick={axis} axisLine={false} tickLine={false} width={140} interval={0} />
        <Tooltip {...tooltipStyle} formatter={(v, k) => [v, k === "other" ? "Other" : labelOf[k]]} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: COLORS.slate }} formatter={(k) => (k === "other" ? "Other" : labelOf[k])} />
        {keys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            stackId="a"
            fill={k === "other" ? OTHER : SERIES[i]}
            stroke="white"
            strokeWidth={2}
            maxBarSize={22}
            radius={i === keys.length - 1 ? [0, 4, 4, 0] : 0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
