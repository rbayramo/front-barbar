import React, { useEffect, useState } from "react";
import { addDays, startOfWeek, endOfWeek } from "date-fns";
import api from "../api/client";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import CalendarToolbar from "../components/CalendarToolbar";
import DayGrid from "../components/DayGrid";
import WeekGrid from "../components/WeekGrid";
import AppointmentModal from "../components/AppointmentModal";
import AppointmentDetailsModal from "../components/AppointmentDetailsModal";
import {
  getUtcRangeForLocalDay,
  getUtcRangeForLocalWeek
} from "../utils/time";

export default function CalendarPage() {
  const [view, setView] = useState("day");
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [editingAppt, setEditingAppt] = useState(null);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  async function loadAppointments(targetDate, currentView) {
    try {
      let range;
      if (currentView === "day") {
        range = getUtcRangeForLocalDay(targetDate);
      } else {
        range = getUtcRangeForLocalWeek(targetDate);
      }

      const res = await api.get("/appointments", {
        params: {
          from: range.from,
          to: range.to
        }
      });
      console.log("appointments via", api.defaults.baseURL, res.status, res.data);
      setAppointments(res.data || []);
    } catch (err) {
      console.error("load appointments", err);
      setAppointments([]);
    }
  }

  useEffect(() => {
    loadAppointments(date, view);
  }, [date, view]);

  function handlePrev() {
    setDate((d) => addDays(d, view === "day" ? -1 : -7));
  }

  function handleNext() {
    setDate((d) => addDays(d, view === "day" ? 1 : 7));
  }

  function handleToday() {
    setDate(new Date());
  }

  function handleEmptySlotClick(slotDate) {
    setSelectedSlot(slotDate);
    setSelectedAppt(null);
    setEditingAppt(null);
    setCreateModalOpen(true);
  }

  function handleAppointmentClick(appt) {
    setSelectedAppt(appt);
    setDetailsModalOpen(true);
  }

  function handleSaved() {
    loadAppointments(date, view);
  }

  function handleUpdated() {
    loadAppointments(date, view);
  }

  function handleEditAppointment(appt) {
    setEditingAppt(appt);
    setSelectedSlot(new Date(appt.startTime));
    setDetailsModalOpen(false);
    setCreateModalOpen(true);
  }

  const topTitle = view === "day" ? "Bu gün" : "Bu həftə";

  return (
    <div className="app-shell">
      <TopBar title={topTitle} />
      <div className="app-content">
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          date={date}
          weekRange={{ start: weekStart, end: weekEnd }}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        {view === "day" ? (
          <DayGrid
            date={date}
            appointments={appointments}
            onEmptySlotClick={handleEmptySlotClick}
            onAppointmentClick={handleAppointmentClick}
          />
        ) : (
          <WeekGrid
            weekStart={weekStart}
            appointments={appointments}
            onEmptySlotClick={handleEmptySlotClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>

      <BottomNav />

      <AppointmentModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingAppt(null);
        }}
        initialDate={selectedSlot}
        appointment={editingAppt}
        onSaved={handleSaved}
      />

      <AppointmentDetailsModal
        open={detailsModalOpen}
        appointment={selectedAppt}
        onClose={() => setDetailsModalOpen(false)}
        onUpdated={handleUpdated}
        onEdit={handleEditAppointment}
      />
    </div>
  );
}
