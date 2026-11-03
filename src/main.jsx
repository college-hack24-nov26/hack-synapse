import React, { useEffect, useState, memo } from 'react';
import { createRoot } from 'react-dom/client';
import parse, { attributesToProps, domToReact } from 'html-react-parser';
import Chart from 'chart.js/auto';
import { createIcons, icons } from 'lucide';
import './startup.css';
import { bootControllers, loadWorkspace } from './workspace.js';

window.Chart = Chart;
window.lucide = { createIcons: (options = {}) => createIcons({ icons, ...options }) };

// Preserve the established canvas/controller boundaries while React owns the
// component tree. Imperative renderers update only their existing DOM islands.
const events = {
  onclick: 'onClick', onchange: 'onChange', oninput: 'onInput',
  onsubmit: 'onSubmit', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp',
  onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave',
  onpointerenter: 'onPointerEnter', onpointerleave: 'onPointerLeave',
  onfocus: 'onFocus', onblur: 'onBlur', onerror: 'onError', onload: 'onLoad',
};

function renderElement(node, props, children) {
  return React.createElement(node.name, props, children);
}

const regions = {
  'tab-telemetry': 'Telemetry', 'tab-exercises': 'Exercises',
  'tab-games': 'Games', 'tab-prediction': 'Prediction',
  'tab-glossary': 'Anatomy', 'tab-settings': 'Settings',
};

function DashboardRegion({ node, elementProps, children }) {
  return renderElement(node, elementProps, children);
}

function toComponents(markup) {
  const options = {
    replace(node) {
      if (node.type === 'script' || node.name === 'script') return <React.Fragment />;
      if (!node.attribs || !node.name) return;
      const attrs = { ...node.attribs };
      const handlers = {};
      for (const [attribute, code] of Object.entries(attrs)) {
        if (!attribute.startsWith('on')) continue;
        delete attrs[attribute];
        if (events[attribute]) {
          // Handler source comes exclusively from our own backend template.
          const handler = new Function('event', code);
          handlers[events[attribute]] = event => {
            if (handler.call(event.currentTarget, event.nativeEvent) === false) event.preventDefault();
          };
        }
      }
      const props = { ...attributesToProps(attrs), ...handlers };
      if (['input', 'textarea', 'select'].includes(node.name)) {
        if ('value' in props) { props.defaultValue = props.value; delete props.value; }
        if ('checked' in props) { props.defaultChecked = props.checked; delete props.checked; }
      }
      const children = node.children?.length ? domToReact(node.children, options) : undefined;
      if (node.name === 'option' && 'selected' in props) delete props.selected;
      if (regions[attrs.id] || node.name === 'header' || node.name === 'aside') {
        return <DashboardRegion node={node} elementProps={props}>{children}</DashboardRegion>;
      }
      return renderElement(node, props, children);
    },
  };
  return parse(markup, options);
}

// Controllers maintain timers, WebGL scenes, dialog state and live SSE values.
// Do not reconcile this subtree after mounting or replace canvas nodes on frames.
const Workspace = memo(function Workspace({ workspace, onError }) {
  useEffect(() => {
    bootControllers(workspace).catch(onError);
  }, []);
  const [tree] = useState(() => toComponents(workspace.body));
  return tree;
});

function App() {
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    loadWorkspace().then(result => { if (active) setWorkspace(result); })
      .catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);
  if (error) return <div className="react-startup" role="alert">
    <h1>NeuroGlove could not start</h1><p>{error}</p>
    <button onClick={() => location.reload()}>Try again</button>
  </div>;
  if (!workspace) return <div className="react-startup" role="status"><h1>NeuroGlove</h1><p>Opening your workspace…</p></div>;
  return <Workspace workspace={workspace} onError={reason => setError(reason.message)} />;
}

createRoot(document.getElementById('root')).render(<App />);
