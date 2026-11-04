/**
 * NeuroGlove Practice Prediction & Progress Outlook
 * Enhanced Interactive SVG Visualization with Magnetic Snapping,
 * Confidence Corridor, Interactive Goal Milestone, and Pin/Compare Mode.
 */

class PredictionView {
  constructor() {
    this.generation = 0;
    this.data = null;
    this.exercise = document.getElementById('predictionExercise');
    this.goal = document.getElementById('predictionGoal');
    this.wrap = document.querySelector('.prediction-chart-wrap');
    this.tooltip = document.getElementById('predictionTooltip');
    this.chartDetail = document.getElementById('predictionChartDetail');
    this.chartHint = document.querySelector('.prediction-chart-hint');
    this.pinnedIndex = null;
    this.activeMetric = null;

    if (this.exercise && this.goal) {
      [this.exercise, this.goal].forEach(control => {
        control.addEventListener('change', () => {
          this.pinnedIndex = null;
          this.refresh();
        });
      });
    }

    // Keyboard shortcut to unpin
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.pinnedIndex !== null) {
        this.unpin();
      }
    });

    // Window resize handler to reposition tooltip if visible
    window.addEventListener('resize', () => {
      if (this.activeMetric) {
        this.updateTooltipPosition(this.activeMetric.cx, this.activeMetric.cy);
      }
    });
  }

  text(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  async refresh() {
    const generation = ++this.generation;
    this.controller?.abort();
    this.controller = new AbortController();

    this.text('predictionEstimate', 'Updating outlook…');
    if (this.tooltip) this.tooltip.hidden = true;

    const query = new URLSearchParams({
      exercise: this.exercise ? this.exercise.value : 'grasp_release',
      goal: this.goal ? this.goal.value : '80',
      mode: 'live'
    });

    try {
      const response = await fetch('/api/prediction?' + query, { signal: this.controller.signal });
      if (!response.ok) throw new Error('Forecast unavailable');
      const data = await response.json();
      if (generation === this.generation) {
        this.data = data;
        this.render(data);
      }
    } catch (error) {
      if (error.name === 'AbortError' || generation !== this.generation) return;
      this.text('predictionEstimate', 'Outlook unavailable');
      this.text('predictionReason', 'The prediction service could not be reached. Please try again.');
      this.text('predictionLatest', '—');
      this.text('predictionTrend', '—');
      const svg = document.getElementById('predictionChart');
      if (svg) svg.replaceChildren();
    }
  }

  render(data) {
    const forecast = data.forecast;
    const goal = Number(data.goal || (this.goal ? this.goal.value : 80));

    this.text('predictionGoalValue', `${goal}%`);
    const ring = document.getElementById('predictionGoalRing');
    if (ring) ring.style.setProperty('--goal-progress', `${goal}%`);

    if (data.status === 'estimated' && forecast) {
      this.text('predictionEstimate', `${forecast.low}–${forecast.high} days`);
      this.text(
        'predictionReason',
        `At your current recorded pace, the ${goal}% practice goal is estimated around ${forecast.days} days away.`
      );
    } else if (data.status === 'reached') {
      this.text('predictionEstimate', 'Goal reached');
      this.text('predictionReason', data.reason || 'You have already reached or exceeded this practice goal.');
    } else if (data.status === 'insufficient') {
      this.text('predictionEstimate', 'Building your history');
      this.text('predictionReason', data.reason || 'Complete scored exercise sessions on at least four different days to see a trend.');
    } else {
      this.text('predictionEstimate', 'Estimate unavailable');
      this.text('predictionReason', data.reason || 'No reliable time estimate can be calculated from current trend.');
    }

    this.text('predictionLatest', Number.isFinite(data.latest) ? `${data.latest.toFixed(1)}%` : '—');
    this.text(
      'predictionTrend',
      Number.isFinite(data.trend_per_week)
        ? `${data.trend_per_week > 0 ? '+' : ''}${data.trend_per_week.toFixed(1)}`
        : '—'
    );

    this.draw(data);
  }

  draw(data) {
    const svg = document.getElementById('predictionChart');
    if (!svg) return;
    svg.replaceChildren();
    if (this.tooltip) this.tooltip.hidden = true;

    const ns = 'http://www.w3.org/2000/svg';
    const make = (tag, attrs = {}, content, parent = svg) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      if (content !== undefined) node.textContent = content;
      parent.append(node);
      return node;
    };

    const W = 1000;
    const H = 360;
    const L = 64;
    const R = 32;
    const T = 28;
    const B = 54;
    const bottom = H - B;
    const right = W - R;

    const y = (val) => bottom - (Math.max(0, Math.min(100, val)) / 100) * (bottom - T);

    // Defs & Gradients
    const defs = make('defs');

    // Gradient under recorded curve
    const areaGrad = make('linearGradient', { id: 'predictionAreaGradient', x1: '0', y1: '0', x2: '0', y2: '1' }, undefined, defs);
    make('stop', { offset: '0%', 'stop-color': '#6a6223', 'stop-opacity': '0.24' }, undefined, areaGrad);
    make('stop', { offset: '70%', 'stop-color': '#9e9458', 'stop-opacity': '0.08' }, undefined, areaGrad);
    make('stop', { offset: '100%', 'stop-color': '#d4c792', 'stop-opacity': '0.01' }, undefined, areaGrad);

    // Gradient for confidence corridor (expected range)
    const rangeGrad = make('linearGradient', { id: 'predictionRangeGradient', x1: '0', y1: '0', x2: '1', y2: '0' }, undefined, defs);
    make('stop', { offset: '0%', 'stop-color': '#d4c792', 'stop-opacity': '0.45' }, undefined, rangeGrad);
    make('stop', { offset: '100%', 'stop-color': '#e8deb3', 'stop-opacity': '0.18' }, undefined, rangeGrad);

    // Grid lines & Y-axis ticks
    [0, 25, 50, 75, 100].forEach((val) => {
      make('line', {
        x1: L,
        x2: right,
        y1: y(val),
        y2: y(val),
        stroke: '#eae6d6',
        'stroke-width': val === 0 ? '1.5' : '1',
        'stroke-dasharray': val === 0 ? '' : '3 4'
      });
      make('text', {
        x: L - 12,
        y: y(val) + 4,
        'text-anchor': 'end',
        'font-size': '11',
        'font-weight': '500',
        fill: '#8e8870'
      }, `${val}%`);
    });

    const points = data.points || [];
    if (!points.length) {
      make('text', {
        x: W / 2,
        y: H / 2,
        'text-anchor': 'middle',
        'font-size': '15',
        'font-weight': '500',
        fill: '#918c75'
      }, 'Your recorded practice trend will appear here.');
      this.text('predictionChartDetail', 'No scored practice days yet.');
      return;
    }

    // Time calculations
    const dayValue = (day) => Date.parse(day + 'T12:00:00Z') / 86400000;
    const startDay = dayValue(points[0].day);
    const lastDay = dayValue(points.at(-1).day);

    const hasForecast = data.status === 'estimated' && data.forecast;
    const horizon = hasForecast ? Math.max(data.forecast.high + 3, 8) : 4;
    const totalSpan = Math.max(1, (lastDay - startDay) + horizon);

    const x = (day) => L + ((day - startDay) / totalSpan) * (right - L);
    const goal = Number(data.goal || 80);

    // Goal line (horizontal dashed line with badge)
    make('line', {
      x1: L,
      x2: right,
      y1: y(goal),
      y2: y(goal),
      stroke: '#b8ac68',
      'stroke-width': '1.5',
      'stroke-dasharray': '5 6'
    });
    make('text', {
      x: right - 6,
      y: y(goal) - 8,
      'text-anchor': 'end',
      'font-size': '11',
      'font-weight': '600',
      'letter-spacing': '0.04em',
      fill: '#7a7032'
    }, `${goal}% GOAL`);

    // Divider line between recorded and projected
    const latestX = x(lastDay);
    make('line', {
      x1: latestX,
      x2: latestX,
      y1: T,
      y2: bottom,
      stroke: '#d5cca8',
      'stroke-width': '1.2',
      'stroke-dasharray': '3 4'
    });

    // Shaded area under recorded curve
    const lineCoordPairs = points.map(p => ({ x: x(dayValue(p.day)), y: y(p.score) }));
    const linePointsStr = lineCoordPairs.map(p => `${p.x},${p.y}`).join(' ');

    make('polygon', {
      class: 'prediction-area',
      points: `${x(startDay)},${bottom} ${linePointsStr} ${latestX},${bottom}`,
      fill: 'url(#predictionAreaGradient)'
    });

    // Expected Range (Confidence Corridor) & Projection Line
    let goalMetric = null;
    if (hasForecast) {
      const lastPoint = points.at(-1);
      const targetDay = lastDay + data.forecast.days;
      const lowDay = lastDay + data.forecast.low;
      const highDay = lastDay + data.forecast.high;

      const targetX = x(targetDay);
      const lowX = x(lowDay);
      const highX = x(highDay);
      const targetY = y(goal);

      // Confidence corridor fan / wedge
      // Expands from (latestX, lastY) towards the goal line between lowX and highX
      make('polygon', {
        class: 'prediction-range',
        points: `${latestX},${y(lastPoint.score)} ${lowX},${targetY} ${highX},${targetY}`,
        fill: 'url(#predictionRangeGradient)'
      });

      // Corridor boundary outlines
      make('line', {
        x1: latestX,
        y1: y(lastPoint.score),
        x2: lowX,
        y2: targetY,
        stroke: '#cbbe7d',
        'stroke-width': '1',
        'stroke-dasharray': '3 4'
      });
      make('line', {
        x1: latestX,
        y1: y(lastPoint.score),
        x2: highX,
        y2: targetY,
        stroke: '#cbbe7d',
        'stroke-width': '1',
        'stroke-dasharray': '3 4'
      });

      // Center projected trajectory line
      make('line', {
        class: 'prediction-projection-line',
        x1: latestX,
        y1: y(lastPoint.score),
        x2: targetX,
        y2: targetY,
        stroke: '#8e813a',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-dasharray': '6 6'
      });

      // Target Goal Milestone Pin
      const targetHalo = make('circle', {
        class: 'prediction-goal-halo',
        cx: targetX,
        cy: targetY,
        r: 14,
        fill: '#8e813a',
        opacity: '0.12'
      });

      const targetPin = make('circle', {
        class: 'prediction-goal-pin',
        cx: targetX,
        cy: targetY,
        r: 7,
        fill: '#fffefa',
        stroke: '#8e813a',
        'stroke-width': '3',
        tabindex: 0,
        role: 'button',
        'aria-label': `Estimated goal reach: ${goal}% in ~${data.forecast.days} days`
      });

      goalMetric = {
        isGoal: true,
        targetDay,
        lowDay,
        highDay,
        days: data.forecast.days,
        low: data.forecast.low,
        high: data.forecast.high,
        goal,
        cx: targetX,
        cy: targetY,
        halo: targetHalo,
        pin: targetPin
      };
    }

    // Observed solid trend line (drawn above areas, below markers)
    make('polyline', {
      class: 'prediction-observed-line',
      points: linePointsStr,
      fill: 'none',
      stroke: '#585e2b',
      'stroke-width': '3.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    });

    // Date formatting helper
    const formatDate = (dateObj, opts = { month: 'short', day: 'numeric' }) =>
      dateObj.toLocaleDateString(undefined, opts);

    // Build recorded points metrics
    const metrics = points.map((point, index) => {
      const cx = x(dayValue(point.day));
      const cy = y(point.score);

      // Vertical guide crosshair (hidden by default, shows on hover/active)
      const crosshair = make('line', {
        class: 'prediction-crosshair',
        x1: cx,
        x2: cx,
        y1: T,
        y2: bottom,
        stroke: '#8a824e',
        'stroke-width': '1.2',
        'stroke-dasharray': '3 4'
      });

      // Halo ring (pulses/expands on hover)
      const halo = make('circle', {
        class: 'prediction-point-halo',
        cx,
        cy,
        r: 13,
        fill: '#6a6223'
      });

      // Solid circle marker
      const circle = make('circle', {
        class: 'prediction-point',
        cx,
        cy,
        r: 6.5,
        fill: '#fffefa',
        stroke: '#585e2b',
        'stroke-width': '3',
        tabindex: 0,
        role: 'button',
        'aria-label': `${point.score.toFixed(1)}% on ${point.day}`
      });

      return {
        point,
        index,
        cx,
        cy,
        crosshair,
        halo,
        circle,
        isGoal: false
      };
    });

    // All interactive nodes (recorded points + optional goal pin)
    const allInteractive = [...metrics];
    if (goalMetric) allInteractive.push(goalMetric);

    // Axis labels
    make('text', {
      x: 18,
      y: (T + bottom) / 2,
      transform: `rotate(-90 18 ${(T + bottom) / 2})`,
      'text-anchor': 'middle',
      'font-size': '10',
      'font-weight': '600',
      'letter-spacing': '0.14em',
      fill: '#9c9578'
    }, 'ACHIEVEMENT');

    make('text', {
      x: (L + right) / 2,
      y: H - 4,
      'text-anchor': 'middle',
      'font-size': '10',
      'font-weight': '600',
      'letter-spacing': '0.14em',
      fill: '#9c9578'
    }, 'PRACTICE DATE');

    // X-axis date ticks (distinct, non-overlapping)
    const tickDates = [];
    tickDates.push({ day: startDay, label: formatDate(new Date(startDay * 86400000)) });

    if (points.length > 2) {
      const midDay = dayValue(points[Math.floor(points.length / 2)].day);
      tickDates.push({ day: midDay, label: formatDate(new Date(midDay * 86400000)) });
    }

    tickDates.push({ day: lastDay, label: formatDate(new Date(lastDay * 86400000)) });

    if (hasForecast) {
      const targetDay = lastDay + data.forecast.days;
      tickDates.push({ day: targetDay, label: formatDate(new Date(targetDay * 86400000)) });
    }

    tickDates.forEach((t, i) => {
      const tx = x(t.day);
      make('line', { x1: tx, x2: tx, y1: bottom, y2: bottom + 6, stroke: '#b5ad92', 'stroke-width': '1' });
      make('text', {
        x: tx,
        y: H - 20,
        'text-anchor': i === 0 ? 'start' : i === tickDates.length - 1 ? 'end' : 'middle',
        'font-size': '11',
        'font-weight': '500',
        fill: '#817b62'
      }, t.label);
    });

    // Interactive pointer handling with magnetic snapping
    const findNearest = (cursorSvgX) => {
      let nearest = allInteractive[0];
      let minDist = Math.abs(nearest.cx - cursorSvgX);
      for (const item of allInteractive) {
        const d = Math.abs(item.cx - cursorSvgX);
        if (d < minDist) {
          minDist = d;
          nearest = item;
        }
      }
      return nearest;
    };

    const activateItem = (item, isPinned = false) => {
      this.activeMetric = item;
      this.highlightItem(item, isPinned);
      this.showTooltip(item);
    };

    // Pointer move over SVG
    svg.onpointermove = (event) => {
      if (this.pinnedIndex !== null && !event.buttons) return;
      const rect = svg.getBoundingClientRect();
      const cursorSvgX = ((event.clientX - rect.left) / rect.width) * W;
      const nearest = findNearest(cursorSvgX);
      activateItem(nearest, false);
    };

    svg.onpointerleave = () => {
      this.hideTooltip();
    };

    // Click to pin/unpin
    svg.onclick = (event) => {
      const rect = svg.getBoundingClientRect();
      const cursorSvgX = ((event.clientX - rect.left) / rect.width) * W;
      const nearest = findNearest(cursorSvgX);

      if (!nearest.isGoal) {
        if (this.pinnedIndex === nearest.index) {
          this.unpin();
        } else {
          this.pinnedIndex = nearest.index;
          activateItem(nearest, true);
        }
      } else {
        this.unpin();
        activateItem(nearest, false);
      }
    };

    // Keyboard navigation on nodes
    metrics.forEach(({ circle, index }, i) => {
      circle.addEventListener('focus', () => activateItem(metrics[i], this.pinnedIndex === index));
      circle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (this.pinnedIndex === index) this.unpin();
          else {
            this.pinnedIndex = index;
            activateItem(metrics[i], true);
          }
        } else if (e.key === 'ArrowRight' && i < metrics.length - 1) {
          e.preventDefault();
          metrics[i + 1].circle.focus();
        } else if (e.key === 'ArrowLeft' && i > 0) {
          e.preventDefault();
          metrics[i - 1].circle.focus();
        }
      });
    });

    if (goalMetric) {
      goalMetric.pin.addEventListener('focus', () => activateItem(goalMetric, false));
      goalMetric.pin.addEventListener('blur', () => this.hideTooltip());
    }

    // Tooltip starts hidden until hovered
    this.hideTooltip();
  }

  highlightItem(item, isPinned) {
    // Reset all highlights
    document.querySelectorAll('#predictionChart .prediction-crosshair').forEach(el => el.classList.remove('is-active'));
    document.querySelectorAll('#predictionChart .prediction-point').forEach(el => el.classList.remove('is-active', 'is-pinned'));
    document.querySelectorAll('#predictionChart .prediction-point-halo').forEach(el => el.classList.remove('is-active'));
    const goalPin = document.querySelector('#predictionChart .prediction-goal-pin');
    const goalHalo = document.querySelector('#predictionChart .prediction-goal-halo');
    if (goalPin) goalPin.classList.remove('is-active');
    if (goalHalo) goalHalo.classList.remove('is-active');

    if (!item.isGoal) {
      if (item.crosshair) item.crosshair.classList.add('is-active');
      if (item.circle) {
        item.circle.classList.add('is-active');
        if (isPinned) item.circle.classList.add('is-pinned');
      }
      if (item.halo) item.halo.classList.add('is-active');
    } else {
      if (item.pin) item.pin.classList.add('is-active');
      if (item.halo) item.halo.classList.add('is-active');
    }
  }

  showTooltip(item) {
    if (!this.tooltip || !this.wrap) return;

    const svg = document.getElementById('predictionChart');
    if (!svg) return;

    if (!item.isGoal) {
      const p = item.point;
      const fullDate = new Date(p.day + 'T12:00:00').toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      let deltaHtml = '';
      if (this.pinnedIndex !== null && this.pinnedIndex !== item.index && this.data?.points) {
        const pinnedPoint = this.data.points[this.pinnedIndex];
        if (pinnedPoint) {
          const delta = p.score - pinnedPoint.score;
          const sign = delta >= 0 ? '+' : '';
          deltaHtml = `<div class="prediction-tooltip-delta">${sign}${delta.toFixed(1)}% vs pinned day</div>`;
        }
      }

      this.tooltip.innerHTML = `
        <div class="prediction-tooltip-score">${p.score.toFixed(1)}% achievement</div>
        <div class="prediction-tooltip-date">${fullDate}</div>
        <div class="prediction-tooltip-sessions">${p.sessions} session${p.sessions === 1 ? '' : 's'} recorded</div>
        ${deltaHtml}
      `;

      const detailText = `${fullDate} · ${p.score.toFixed(1)}% · ${p.sessions} session${p.sessions === 1 ? '' : 's'}${p.minutes ? ` (${p.minutes.toFixed(1)} min)` : ''}`;
      this.text('predictionChartDetail', detailText);

      if (this.chartHint) {
        this.chartHint.textContent = this.pinnedIndex !== null
          ? 'Day pinned · Click graph or Esc to clear'
          : 'Move to explore · Click to pin';
      }
    } else {
      // Goal Target Milestone
      const targetDate = new Date(item.targetDay * 86400000).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      this.tooltip.innerHTML = `
        <div class="prediction-tooltip-score">Goal Target: ${item.goal}%</div>
        <div class="prediction-tooltip-date">Estimated ${targetDate}</div>
        <div class="prediction-tooltip-sessions">~${item.days} days away (window: ${item.low}–${item.high} days)</div>
      `;

      this.text(
        'predictionChartDetail',
        `Projected goal reach around ${targetDate} (estimated window: ${item.low} to ${item.high} days).`
      );
      if (this.chartHint) {
        this.chartHint.textContent = 'Projected milestone based on current practice trend';
      }
    }

    this.updateTooltipPosition(item.cx, item.cy);
    this.tooltip.hidden = false;
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.hidden = true;
    this.activeMetric = null;
    document.querySelectorAll('#predictionChart .prediction-crosshair').forEach(el => el.classList.remove('is-active'));
    document.querySelectorAll('#predictionChart .prediction-point').forEach(el => {
      el.classList.remove('is-active');
      if (this.pinnedIndex !== null && el.getAttribute('data-index') === String(this.pinnedIndex)) {
        el.classList.add('is-pinned');
      } else {
        el.classList.remove('is-pinned');
      }
    });
    document.querySelectorAll('#predictionChart .prediction-point-halo').forEach(el => el.classList.remove('is-active'));
    const goalPin = document.querySelector('#predictionChart .prediction-goal-pin');
    const goalHalo = document.querySelector('#predictionChart .prediction-goal-halo');
    if (goalPin) goalPin.classList.remove('is-active');
    if (goalHalo) goalHalo.classList.remove('is-active');
  }

  updateTooltipPosition(cx, cy) {
    if (!this.tooltip || !this.wrap) return;
    const svg = document.getElementById('predictionChart');
    if (!svg) return;

    const wrapRect = this.wrap.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const W = 1000;
    const H = 360;

    const pixelX = (svgRect.left - wrapRect.left) + (cx * (svgRect.width / W));
    const pixelY = (svgRect.top - wrapRect.top) + (cy * (svgRect.height / H));

    this.tooltip.style.left = `${pixelX}px`;
    this.tooltip.style.top = `${pixelY}px`;

    // Flip tooltip downward if too close to top
    if (pixelY < 95) {
      this.tooltip.classList.add('is-flipped');
    } else {
      this.tooltip.classList.remove('is-flipped');
    }
  }

  unpin() {
    this.pinnedIndex = null;
    if (this.chartHint) {
      this.chartHint.textContent = 'Move to explore · Click to pin';
    }
    if (this.data?.points) {
      const latestIndex = this.data.points.length - 1;
      const latestMetric = {
        point: this.data.points[latestIndex],
        index: latestIndex,
        isGoal: false,
        cx: 0,
        cy: 0
      };
      // Trigger redraw of highlight
      const activeEl = document.querySelectorAll('#predictionChart .prediction-point')[latestIndex];
      if (activeEl) {
        document.querySelectorAll('#predictionChart .prediction-point').forEach(el => el.classList.remove('is-pinned'));
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('tab-prediction')) return;
  window.predictionView = new PredictionView();
  if (document.getElementById('tab-prediction').classList.contains('active')) {
    window.predictionView.refresh();
  }
});
