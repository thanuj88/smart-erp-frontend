import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toIsoDay = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDay = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDisplay = (value) => {
  const date = parseIsoDay(value);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' });
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const DateRangePicker = ({ startDate, endDate, onChange, placeholder = 'Date range' }) => {
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseIsoDay(startDate) || new Date()));
  const [draftStart, setDraftStart] = useState('');
  const [hoverDate, setHoverDate] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 });

  onChangeRef.current = onChange;

  const commitRange = (start, end) => {
    onChangeRef.current({ startDate: start, endDate: end || start });
  };

  useEffect(() => {
    if (!open) {
      setDraftStart('');
      setHoverDate('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 280;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const below = rect.bottom + 6;
      const popoverHeight = 320;
      const top = below + popoverHeight > window.innerHeight - 8
        ? Math.max(8, rect.top - popoverHeight - 6)
        : below;
      setCoords({ top, left, width });
    };

    updatePosition();
    const onDocClick = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (popoverRef.current?.contains(event.target)) return;
      if (draftStart) {
        const start = hoverDate && hoverDate < draftStart ? hoverDate : draftStart;
        const end = hoverDate && hoverDate > draftStart ? hoverDate : draftStart;
        commitRange(start, end);
      }
      setOpen(false);
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open, draftStart, hoverDate]);

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const startWeekday = first.getDay();
    const grid = [];
    const cursor = new Date(first);
    cursor.setDate(1 - startWeekday);
    for (let i = 0; i < 42; i += 1) {
      grid.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return grid;
  }, [viewMonth]);

  const label = startDate
    ? endDate && endDate !== startDate
      ? `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`
      : formatDisplay(startDate)
    : '';

  const rangeStart = draftStart || startDate;
  const rangeEnd = draftStart ? hoverDate : endDate;

  const pickDay = (iso) => {
    if (!draftStart) {
      setDraftStart(iso);
      setHoverDate(iso);
      return;
    }
    const start = draftStart < iso ? draftStart : iso;
    const end = draftStart < iso ? iso : draftStart;
    commitRange(start, end);
    setDraftStart('');
    setHoverDate('');
    setOpen(false);
  };

  const clearRange = (event) => {
    event.stopPropagation();
    commitRange('', '');
    setDraftStart('');
    setHoverDate('');
    setOpen(false);
  };

  return (
    <div className="date-range-picker" ref={triggerRef}>
      <button
        type="button"
        className={`date-range-trigger${startDate ? ' has-value' : ''}`}
        onClick={(event) => {
          if (event.target.closest('.date-range-clear')) return;
          if (open) {
            if (draftStart) {
              const start = hoverDate && hoverDate < draftStart ? hoverDate : draftStart;
              const end = hoverDate && hoverDate > draftStart ? hoverDate : draftStart;
              commitRange(start, end);
            }
            setOpen(false);
            return;
          }
          setViewMonth(startOfMonth(parseIsoDay(startDate) || new Date()));
          setDraftStart('');
          setHoverDate('');
          setOpen(true);
        }}
        aria-label="Date range"
      >
        <i className="bi bi-calendar3" aria-hidden="true" />
        <span className={label ? '' : 'date-range-placeholder'}>{label || placeholder}</span>
      </button>
      {startDate ? (
        <button
          type="button"
          className="date-range-clear"
          onClick={clearRange}
          aria-label="Clear dates"
        >
          ×
        </button>
      ) : null}

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="date-range-popover"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            <div className="date-range-month-nav">
              <button
                type="button"
                className="date-range-nav-btn"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                aria-label="Previous month"
              >
                ‹
              </button>
              <strong>
                {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </strong>
              <button
                type="button"
                className="date-range-nav-btn"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className="date-range-weekdays">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="date-range-grid">
              {days.map((date) => {
                const iso = toIsoDay(date);
                const inMonth = date.getMonth() === viewMonth.getMonth();
                const start = rangeStart && rangeEnd
                  ? (rangeStart < rangeEnd ? rangeStart : rangeEnd)
                  : rangeStart;
                const end = rangeStart && rangeEnd
                  ? (rangeStart < rangeEnd ? rangeEnd : rangeStart)
                  : '';
                const isStart = iso === start;
                const isEnd = iso === end;
                const inRange = start && end && iso > start && iso < end;
                return (
                  <button
                    key={iso + date.getMonth()}
                    type="button"
                    className={[
                      'date-range-day',
                      inMonth ? '' : 'is-outside',
                      isStart || isEnd ? 'is-selected' : '',
                      inRange ? 'is-in-range' : '',
                      isStart && end ? 'is-range-start' : '',
                      isEnd && start && start !== end ? 'is-range-end' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => pickDay(iso)}
                    onMouseEnter={() => {
                      if (draftStart) setHoverDate(iso);
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <p className="date-range-hint">
              {draftStart ? 'Select the end date' : 'Select a start date'}
            </p>
          </div>,
          document.body
        )}
    </div>
  );
};

DateRangePicker.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default DateRangePicker;
