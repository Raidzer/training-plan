"use client";
import { useState } from "react";

export default function WorkoutsPage() {
  const [form, setForm] = useState({
    date: "",
    type: "easy",
    distanceKm: "",
    timeSec: "",
    avgHr: "",
    rpe: "",
    comment: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    alert(res.ok ? "Сохранено" : "Ошибка");
  };

  return (
    <main>
      <h1>Дневник</h1>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, maxWidth: 420 }}
      >
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="easy">easy</option>
          <option value="tempo">tempo</option>
          <option value="interval">interval</option>
          <option value="long">long</option>
          <option value="race">race</option>
        </select>
        <input
          placeholder="км"
          value={form.distanceKm}
          onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
        />
        <input
          placeholder="время сек"
          value={form.timeSec}
          onChange={(e) => setForm({ ...form, timeSec: e.target.value })}
        />
        <input
          placeholder="средний пульс"
          value={form.avgHr}
          onChange={(e) => setForm({ ...form, avgHr: e.target.value })}
        />
        <input
          placeholder="RPE"
          value={form.rpe}
          onChange={(e) => setForm({ ...form, rpe: e.target.value })}
        />
        <input
          placeholder="комментарий"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
        <button>Сохранить</button>
      </form>
    </main>
  );
}
