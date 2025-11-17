import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import api from "../api/client";

// Detect user's time zone from the browser, fallback to UTC
const userTimeZone =
  typeof Intl !== "undefined" && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";


// Map English short weekday names to Azerbaijani short labels
const EN_TO_AZ_WEEKDAY_SHORT = {
  Sun: "B.",
  Mon: "B.e.",
  Tue: "Ç.a.",
  Wed: "Ç.",
  Thu: "C.a.",
  Fri: "C.",
  Sat: "Ş."
};


// Convert a date string from the API (UTC) to a weekday label in the user's time zone
function formatUtcDateToWeekdayLabel(dateFromApi) {
  if (!dateFromApi) return "";

  // Support both "YYYY-MM-DD" and full ISO strings
  const hasTime = dateFromApi.includes("T");
  const base = hasTime ? dateFromApi : `${dateFromApi}T00:00:00Z`;
  const hasZone = /[zZ]$/.test(base);
  const finalIso = hasZone ? base : `${base}Z`;

  const utcDate = new Date(finalIso);

  // Get the correct local weekday as an English short name (Mon, Tue, ...)
  const englishShort = utcDate.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: userTimeZone
  });

  // Convert to Azerbaijani short name, fall back to English if something unexpected
  return EN_TO_AZ_WEEKDAY_SHORT[englishShort] || englishShort;
}


// Convert an hour bucket in UTC (0-23) to a "HH:mm" label in the user's time zone
function formatUtcHourToUserLabel(hour) {
  const safeHour = Number.isFinite(hour) ? hour : 0;

  // Fixed reference date in UTC with that hour
  const utcDate = new Date(Date.UTC(2000, 0, 1, safeHour, 0, 0));

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: userTimeZone
  });

  return formatter.format(utcDate);
}


export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/dashboard/summary");
        setSummary(res.data);
      } catch (err) {
        console.error("dashboard summary", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <TopBar title="Panel" />
        <div className="app-content">
          <div className="empty-text">Yüklənir...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="app-shell">
        <TopBar title="Panel" />
        <div className="app-content">
          <div className="empty-text">Panel məlumatlarını yükləmək mümkün olmadı.</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const weekly = summary.weeklyAppointments || [];
  const maxWeekly =
    weekly.length > 0
      ? Math.max(...weekly.map((d) => d.count), 1)
      : 1;

  const recency = summary.recencyBuckets || {};
  const recencyEntries = Object.entries(recency);
  const maxRecency =
    recencyEntries.length > 0
      ? Math.max(...recencyEntries.map(([, v]) => v || 0), 1)
      : 1;

  const topHours = summary.topHours || [];
  const maxTopHours =
    topHours.length > 0
      ? Math.max(...topHours.map((d) => d.count), 1)
      : 1;

  return (
    <div className="app-shell">
      <TopBar title="Panel" />
      <div className="app-content">
        {/* Top-level KPI cards */}
        <div className="cards-column dashboard-cards-row">
          <div className="stat-card kpi-3d">
            <div className="stat-label">Bu gün görüşlər</div>
            <div className="stat-value">{summary.todayAppointments}</div>
          </div>
          <div className="stat-card kpi-3d">
            <div className="stat-label">Bu həftə görüşlər</div>
            <div className="stat-value">{summary.weekAppointments}</div>
          </div>
          <div className="stat-card kpi-3d">
            <div className="stat-label">Aktiv müştərilər</div>
            <div className="stat-value">{summary.totalCustomers}</div>
          </div>
          <div className="stat-card kpi-3d">
            <div className="stat-label">Qayıdan müştəri faizi</div>
            <div className="stat-value">
              {summary.returningRate}%{" "}
              <span className="stat-subvalue">
                ({summary.returningClients} nəfər)
              </span>
            </div>
          </div>
        </div>

        {/* Charts grid */}
        <div className="dashboard-charts-grid">
          {/* Weekly appointments */}
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">Həftəlik görüş həcmi</div>
              <div className="chart-subtitle">
                Həftənin günlərinə görə görüş sayı
              </div>
            </div>
            <div className="chart-bars">
              {weekly.length === 0 && (
                <div className="empty-text small">
                  Bu həftə üçün hələ görüş yoxdur.
                </div>
              )}
              {weekly.map((d) => {
                const label = formatUtcDateToWeekdayLabel(d.date);
                const height = (d.count / maxWeekly) * 100;
                return (
                  <div key={d.date} className="chart-bar-column">
                    <div className="chart-bar">
                      <div
                        className="chart-bar-inner chart-bar-inner-3d"
                        style={{ height: `${height || 0}%` }}
                      />
                    </div>
                    <div className="chart-bar-label">{label}</div>
                    <div className="chart-bar-value">{d.count}</div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Recency buckets */}
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">Müştəri aktivliyi</div>
              <div className="chart-subtitle">
                Son ziyarətdən keçən günlərə görə bölünmə
              </div>
            </div>
            <div className="chart-bars">
              {recencyEntries.length === 0 && (
                <div className="empty-text small">
                  Hələ müştəri məlumatı yoxdur.
                </div>
              )}
              {recencyEntries.map(([bucket, value]) => {
                const height = (value / maxRecency) * 100;
                let bucketLabel = bucket;
                if (bucket === "0-30") bucketLabel = "0–30 gün";
                else if (bucket === "31-60") bucketLabel = "31–60 gün";
                else if (bucket === "61-90") bucketLabel = "61–90 gün";
                else if (bucket === "90+") bucketLabel = "90+ gün";
                else if (bucket === "no-visit") bucketLabel = "Hələ ziyarət yoxdur";

                return (
                  <div key={bucket} className="chart-bar-column">
                    <div className="chart-bar chart-bar-soft">
                      <div
                        className="chart-bar-inner chart-bar-inner-3d-secondary"
                        style={{ height: `${height || 0}%` }}
                      />
                    </div>
                    <div className="chart-bar-label bucket-label">
                      {bucketLabel}
                    </div>
                    <div className="chart-bar-value">{value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Busiest hours */}
          <div className="chart-card wide">
            <div className="chart-header">
              <div className="chart-title">Ən işlək saatlar</div>
              <div className="chart-subtitle">
                Son 30 gün üzrə daha çox görüş olan saatlar
              </div>
            </div>
            <div className="chart-bars horizontal">
              {topHours.length === 0 && (
                <div className="empty-text small">
                  Hələ kifayət qədər görüş yoxdur.
                </div>
              )}
              {topHours.map((h) => {
                const width = (h.count / maxTopHours) * 100;
                const label = formatUtcHourToUserLabel(h.hour);
                return (
                  <div key={h.hour} className="chart-bar-row-horizontal">
                    <div className="chart-bar-label-horizontal">
                      {label}
                    </div>
                    <div className="chart-bar-horizontal">
                      <div
                        className="chart-bar-inner chart-bar-inner-3d"
                        style={{ width: `${width || 0}%` }}
                      />
                    </div>
                    <div className="chart-bar-value-horizontal">
                      {h.count}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
