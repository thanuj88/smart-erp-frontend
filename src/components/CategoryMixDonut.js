import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const MIX_COLORS = ['#ff9f43', '#4b7bff', '#28c76f', '#ea5455', '#00cfe8', '#7367f0', '#82868b'];
const CX = 60;
const CY = 60;
const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const START_OFFSET = CIRCUMFERENCE / 4;
const INNER_R = 38;
const OUTER_R = 47;
const ELBOW_R = 55;
const ON_SLICE_MIN = 0.1;
const CALLOUT_GAP = 8.5;

const compactValue = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
};

const nudgeCallouts = (rings) => {
  ['left', 'right'].forEach((side) => {
    const group = rings
      .filter((ring) => ring.external && ring.side === side)
      .sort((a, b) => a.labelY - b.labelY);
    for (let i = 1; i < group.length; i += 1) {
      if (group[i].labelY - group[i - 1].labelY < CALLOUT_GAP) {
        group[i].labelY = group[i - 1].labelY + CALLOUT_GAP;
        group[i].elbowY = group[i].labelY;
      }
    }
  });
  return rings;
};

const CategoryMixDonut = ({ slices, formatMoney }) => {
  const { t } = useTranslation();
  const model = useMemo(() => {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    let offset = START_OFFSET;
    let startPortion = 0;
    const rings = slices.map((slice, index) => {
      const portion = total > 0 ? slice.value / total : 0;
      const length = portion * CIRCUMFERENCE;
      const midRad = -Math.PI / 2 + (startPortion + portion / 2) * 2 * Math.PI;
      const cos = Math.cos(midRad);
      const sin = Math.sin(midRad);
      const onSlice = portion >= ON_SLICE_MIN;
      const side = cos >= 0 ? 'right' : 'left';
      const dir = side === 'right' ? 1 : -1;
      const elbowX = CX + ELBOW_R * cos;
      const elbowY = CY + ELBOW_R * sin;
      const ring = {
        ...slice,
        color: MIX_COLORS[index % MIX_COLORS.length],
        dash: `${length} ${CIRCUMFERENCE - length}`,
        offset,
        pct: Math.round(portion * 100),
        compact: compactValue(slice.value),
        onSlice,
        external: !onSlice,
        side,
        labelX: CX + INNER_R * cos,
        labelY: onSlice ? CY + INNER_R * sin : elbowY,
        startX: CX + OUTER_R * cos,
        startY: CY + OUTER_R * sin,
        elbowX,
        elbowY,
        endX: elbowX + dir * 8,
        textAnchor: dir > 0 ? 'start' : 'end',
      };
      offset -= length;
      startPortion += portion;
      return ring;
    });
    return { total, rings: nudgeCallouts(rings) };
  }, [slices]);

  return (
    <div className="card shadow-sm rounded-4 dashboard-widget-card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-baseline justify-content-between gap-2">
          <h5 className="card-title mb-0">{t('widgetCategoryMix')}</h5>
          <span className="text-muted small">{t('categoryMixToday')}</span>
        </div>
        {model.total <= 0 ? (
          <div className="text-muted small py-4 text-center">{t('noSalesTodayMix')}</div>
        ) : (
          <div className="category-mix">
            <div className="category-mix-chart">
              <svg viewBox="0 0 120 120" role="img" aria-label={t('todayRevenueByCategory')}>
                <circle className="category-mix-track" cx={CX} cy={CY} r={RADIUS} />
                {model.rings.map((ring) => (
                  <circle
                    key={ring.name}
                    className="category-mix-slice"
                    cx={CX}
                    cy={CY}
                    r={RADIUS}
                    stroke={ring.color}
                    strokeDasharray={ring.dash}
                    strokeDashoffset={ring.offset}
                  />
                ))}
                {model.rings.filter((ring) => ring.onSlice).map((ring) => (
                  <text
                    key={`${ring.name}-label`}
                    className="category-mix-slice-label"
                    x={ring.labelX}
                    y={ring.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan x={ring.labelX} dy="-0.35em">{ring.pct}%</tspan>
                    <tspan className="category-mix-slice-value" x={ring.labelX} dy="1.15em">
                      {ring.compact}
                    </tspan>
                  </text>
                ))}
                {model.rings.filter((ring) => ring.external).map((ring) => {
                  const textX = ring.endX + (ring.side === 'right' ? 2.2 : -2.2);
                  const line = `M ${ring.startX} ${ring.startY} L ${ring.elbowX} ${ring.elbowY} L ${ring.endX} ${ring.labelY}`;
                  const tip = ring.side === 'right' ? 3.2 : -3.2;
                  return (
                    <g key={`${ring.name}-callout`} className="category-mix-callout">
                      <path d={line} fill="none" stroke={ring.color} strokeWidth="1.15" />
                      <polygon
                        fill={ring.color}
                        points={`${ring.endX},${ring.labelY} ${ring.endX - tip},${ring.labelY - 1.7} ${ring.endX - tip},${ring.labelY + 1.7}`}
                      />
                      <text
                        className="category-mix-callout-label"
                        x={textX}
                        y={ring.labelY}
                        textAnchor={ring.textAnchor}
                        dominantBaseline="middle"
                      >
                        <tspan x={textX} dy="-0.4em">{ring.pct}%</tspan>
                        <tspan className="category-mix-callout-value" x={textX} dy="1.15em">
                          {ring.compact}
                        </tspan>
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="category-mix-center">
                <small>{t('revenue')}</small>
                <strong>{formatMoney(model.total)}</strong>
              </div>
            </div>
            <ul className="category-mix-legend">
              {model.rings.map((ring) => (
                <li key={ring.name}>
                  <span className="category-mix-swatch" style={{ background: ring.color }} />
                  <span className="category-mix-name" title={ring.name}>{ring.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

CategoryMixDonut.propTypes = {
  slices: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  formatMoney: PropTypes.func.isRequired,
};

export default CategoryMixDonut;
