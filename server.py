"""Standalone React host + copied NeuroGlove API; never imports the parent app."""
import argparse
import atexit
import logging
from pathlib import Path

from flask import send_from_directory
from web.app import app
from engine.edge_pipeline import pipeline

ROOT = Path(__file__).resolve().parent
workspace_view = app.view_functions['index']


@app.get('/api/react/workspace')
def react_workspace():
    return workspace_view()


def react_index():
    if not (ROOT / 'dist' / 'index.html').exists():
        return 'Build the React frontend first: npm install && npm run build', 503
    return send_from_directory(ROOT / 'dist', 'index.html')


app.view_functions['index'] = react_index


@app.get('/assets/<path:filename>')
def react_assets(filename):
    return send_from_directory(ROOT / 'dist' / 'assets', filename)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', choices=('serial', 'mqtt', 'simulate'), default='serial')
    parser.add_argument('--serial-port', default='COM11')
    parser.add_argument('--baud', type=int, default=115200)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5002)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    pipeline.serial_receiver.port = args.serial_port
    pipeline.serial_receiver.baud = args.baud
    pipeline.set_source(args.source)
    pipeline.start()
    atexit.register(pipeline.stop)
    app.run(host=args.host, port=args.port, debug=False, threaded=True, use_reloader=False)
