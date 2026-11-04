"""Portable JSON-forest inference: no pickle or sklearn version dependency on the Pi."""
import json,math,statistics
from functools import lru_cache
from pathlib import Path
@lru_cache(maxsize=1)
def artifact():return json.loads(Path(__file__).with_name('model.json').read_text(encoding='utf-8'))
def estimate(features):
    predictions=[]
    for t in artifact()['trees']:
        node=0
        while t['left'][node]!=-1:
            node=t['left'][node] if features[t['feature'][node]]<=t['threshold'][node] else t['right'][node]
        predictions.append(t['value'][node])
    predictions.sort()
    return {'days':max(1,math.ceil(statistics.mean(predictions))),'low':max(1,math.floor(predictions[int(len(predictions)*.1)])),'high':max(1,math.ceil(predictions[int(len(predictions)*.9)]))}
