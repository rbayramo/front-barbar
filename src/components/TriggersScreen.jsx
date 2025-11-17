import React, { useMemo, useState, useEffect } from "react";

function TriggersScreen({
  onBack,
  triggers,
  triggerForm,
  setTriggerForm,
  triggerError,
  onSaveTrigger,
  onToggleTrigger,
  onDeleteTrigger
}) {
  const [selectedType, setSelectedType] = useState(
    triggerForm.type || "before_appointment"
  );

  useEffect(() => {
    if (!triggerForm.type) return;
    setSelectedType(triggerForm.type);
  }, [triggerForm.type]);

  const activeCount = useMemo(
    () => triggers.filter((t) => t.active).length,
    [triggers]
  );

  const filteredTriggers = useMemo(
    () => triggers.filter((t) => t.type === selectedType),
    [triggers, selectedType]
  );

  const isBefore = selectedType === "before_appointment";

  const handleTypeChange = (value) => {
    setSelectedType(value);
    setTriggerForm({
      ...triggerForm,
      type: value
    });
  };

  const handleOffsetChange = (e) => {
    setTriggerForm({
      ...triggerForm,
      offsetValue: Number(e.target.value) || 1
    });
  };

  const handleMessageChange = (e) => {
    setTriggerForm({
      ...triggerForm,
      message: e.target.value
    });
  };

  const quickOffsets = isBefore ? [1, 2, 3] : [7, 14, 30];

  return (
    <div className="triggers-screen">
      {/* Local header */}
      <div className="settings-subheader">
        {onBack && (
          <button
            type="button"
            className="subheader-back-btn"
            onClick={onBack}
          >
            <span aria-hidden="true">‹</span>
          </button>
        )}
        <div className="settings-subheader-titles">
          <div className="settings-subheader-title">Avtomatik mesajlar</div>
          <div className="settings-subheader-subtitle">
            Müştərilərə görüşdən əvvəl və sonra avtomatik WhatsApp mesajları.
          </div>
        </div>
      </div>

      <div className="triggers-card">
        <div className="triggers-header">
          <div className="triggers-header-top">
            <div>
              <div className="triggers-title">Avtomatik qaydalar</div>
              <div className="triggers-subtitle">
                Sistem sizin yerinizə müştərilərə xatırlatma və geri dönüş
                mesajları göndərir.
              </div>
            </div>
            <div className="triggers-kpi">
              <div className="triggers-kpi-value">{activeCount}</div>
              <div className="triggers-kpi-label">aktiv qayda</div>
            </div>
          </div>

          <div className="trigger-type-switch">
            <button
              type="button"
              className={
                selectedType === "before_appointment"
                  ? "trigger-type-btn is-active"
                  : "trigger-type-btn"
              }
              onClick={() => handleTypeChange("before_appointment")}
            >
              Görüşdən əvvəl
            </button>
            <button
              type="button"
              className={
                selectedType === "after_last_visit"
                  ? "trigger-type-btn is-active"
                  : "trigger-type-btn"
              }
              onClick={() => handleTypeChange("after_last_visit")}
            >
              Son ziyarət sonrası
            </button>
          </div>
        </div>

        {/* List of triggers */}
        <div className="trigger-list modern">
          {filteredTriggers.length === 0 && (
            <div className="empty-text small">
              Bu kateqoriya üçün hələ qayda yoxdur. Aşağıda yeni qayda əlavə
              edin.
            </div>
          )}

          {filteredTriggers.map((t) => {
            const isBeforeTrigger = t.type === "before_appointment";
            const delayLabel = isBeforeTrigger
              ? "Görüşdən " +
                Math.max(1, Math.round((t.offsetMinutes || 0) / 60)) +
                " saat əvvəl"
              : "Son ziyarətdən " + (t.offsetDays || 1) + " gün sonra";

            const typeLabel = isBeforeTrigger
              ? "Görüş xatırlatması"
              : "Reaktivasiya mesajı";

            const icon = isBeforeTrigger ? "⏰" : "🔁";

            const preview =
              (t.message || "").length > 90
                ? (t.message || "").slice(0, 90) + "…"
                : t.message || "";

            return (
              <div
                key={t._id}
                className="trigger-row"
              >
                <div className="trigger-icon-badge">{icon}</div>

                <div className="trigger-row-main">
                  <div className="trigger-row-top">
                    <div className="trigger-row-title">{delayLabel}</div>
                    <div
                      className={
                        t.active
                          ? "trigger-status-dot is-on"
                          : "trigger-status-dot"
                      }
                    />
                  </div>
                  <div className="trigger-row-type-label">{typeLabel}</div>
                  <p className="trigger-row-message">{preview}</p>
                </div>

                <div className="trigger-row-actions">
                  <label className="trigger-switch">
                    <input
                      type="checkbox"
                      checked={t.active}
                      onChange={() => onToggleTrigger(t)}
                    />
                    <span className="trigger-switch-slider" />
                  </label>
                  <button
                    type="button"
                    className="trigger-row-delete-btn"
                    onClick={() => onDeleteTrigger(t)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="trigger-form-divider" />

        {/* Create new trigger */}
        <form className="trigger-form modern" onSubmit={onSaveTrigger}>
          <div className="trigger-form-header">
            <div className="trigger-form-title">Yeni qayda</div>
            <div className="trigger-form-subtitle">
              Tez-tez göndərdiyiniz mesajları bir dəfə yazın, qalanını sistem
              etsin.
            </div>
          </div>

          <div className="field-row">
            <div className="field-label">Trigger tipi</div>
            <div className="trigger-type-switch small">
              <button
                type="button"
                className={
                  triggerForm.type === "before_appointment"
                    ? "trigger-type-btn is-active"
                    : "trigger-type-btn"
                }
                onClick={() => handleTypeChange("before_appointment")}
              >
                Görüşdən əvvəl
              </button>
              <button
                type="button"
                className={
                  triggerForm.type === "after_last_visit"
                    ? "trigger-type-btn is-active"
                    : "trigger-type-btn"
                }
                onClick={() => handleTypeChange("after_last_visit")}
              >
                Son ziyarət sonrası
              </button>
            </div>
          </div>

          <div className="field-row">
            <div className="field-label">
              {triggerForm.type === "before_appointment"
                ? "Neçə saat əvvəl göndərilsin?"
                : "Neçə gün sonra göndərilsin?"}
            </div>
            <div className="trigger-offset-row">
              <div className="duration-chips trigger-offset-chips">
                {quickOffsets.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      triggerForm.offsetValue === value
                        ? "chip active"
                        : "chip"
                    }
                    onClick={() =>
                      setTriggerForm({
                        ...triggerForm,
                        offsetValue: value
                      })
                    }
                  >
                    {value}{" "}
                    {triggerForm.type === "before_appointment"
                      ? "saat"
                      : "gün"}
                  </button>
                ))}
              </div>
              <input
                className="text-input trigger-offset-input"
                type="number"
                min={1}
                value={triggerForm.offsetValue}
                onChange={handleOffsetChange}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-label">Mesaj mətni</div>
            <textarea
              className="text-input full contact-note-textarea"
              rows={4}
              placeholder="Məs: Salam {name}, sabah sizi salonumuzda gözləyirik. Gəlmək mümkün deyilsə, zəhmət olmasa xəbər edin."
              value={triggerForm.message}
              onChange={handleMessageChange}
            />
            <div className="trigger-hint">
              Mətndə müştəri adını əlavə etmək üçün{" "}
              <code>{`{name}`}</code> istifadə edin.
            </div>
          </div>

          {triggerError && <div className="error-text">{triggerError}</div>}

          <div className="sheet-footer">
            <button type="submit" className="primary-btn full">
              Qaydanı yadda saxla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TriggersScreen;
