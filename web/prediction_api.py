"""Experimental practice-goal forecasts. No clinical recovery/prognosis output."""
from datetime import datetime,timezone,timedelta
import json,math,re,statistics,random
from flask import jsonify,request
from engine.guided_exercises import EXERCISES
from ml.progress.model import artifact,estimate

DEFAULT_TARGETS = {
    'grasp_flex_pct': 70,
    'finger_flex_pct': 65,
    'thumb_flex_pct': 60,
    'wrist_degrees': 30,
    'rotation_degrees': 45,
    'grip_pressure_pct': 35
}

def comparable_session(row, exercise):
    protocol = row['protocol_version']
    # v4 changed pressure scoring only; other exercise scores are unchanged.
    if exercise != 'grip_pressure' and protocol in ('paced-reach-return-v4', 'paced-reach-return-v3'):
        protocol = 'paced-reach-return-v3'
    raw = row['calibration_json']
    try:
        cal = json.loads(raw)
        if isinstance(cal, dict):
            target_key = {
                'grasp_release': 'grasp_flex_pct',
                'individual_fingers': 'finger_flex_pct',
                'thumb_opposition': 'thumb_flex_pct',
                'wrist_flexion': 'wrist_degrees',
                'forearm_rotation': 'rotation_degrees',
                'grip_pressure': 'grip_pressure_pct'
            }.get(exercise)
            target = cal.get('targets', {}).get(target_key)
            if target is None:
                target = DEFAULT_TARGETS.get(target_key, 'standard')
            return protocol, target
    except (ValueError, TypeError):
        pass
    return protocol, raw

def summarise(points,games,goal):
    if not points:return {'status':'insufficient','reason':'Complete scored exercise sessions on at least four different days to see a trend.','points':[],'evidence':[],'game_sessions':len(games)}
    dates=[datetime.fromisoformat(p['day']).date() for p in points]
    xs=[(d-dates[0]).days for d in dates];ys=[p['score'] for p in points]
    mx=statistics.mean(xs);my=statistics.mean(ys)
    slope=sum((x-mx)*(y-my) for x,y in zip(xs,ys))/max(1,sum((x-mx)**2 for x in xs))
    span=max(1,xs[-1]+1);frequency=min(7,len(points)*7/span)
    minutes=sum(p['minutes'] for p in points)/span
    variability=statistics.pstdev(ys);latest=ys[-1]
    changes=[]
    for key in ('fruit','dino','balloon'):
        items=[g for g in games if g['game']==key]
        if len(items)<3:continue
        # Compare only runs with the same settings, per game; points across games aren't comparable.
        settings=items[-1].get('settings','');items=[g for g in items if g.get('settings','')==settings]
        if len(items)<3:continue
        first=statistics.mean(g['score']*60/g['seconds'] for g in items[:2]);last=statistics.mean(g['score']*60/g['seconds'] for g in items[-2:])
        if first>0:changes.append(max(-50,min(50,(last-first)/first*100)))
    game_trend=statistics.mean(changes) if changes else 0
    evidence=[{'label':'Latest daily achievement','value':f'{latest:.1f}%','detail':f'Attempt-weighted score for {points[-1]["day"]}.'},
      {'label':'Observed exercise trend','value':f'{slope*7:+.1f} points / week','detail':f'Linear trend across {len(points)} comparable practice days; missing days are not scored as zero.'},
      {'label':'Practice frequency','value':f'{frequency:.1f} days / week','detail':f'Based on the {span}-day observed window.'},
      {'label':'Game performance trend','value':f'{game_trend:+.0f}%' if changes else 'Not enough comparable runs','detail':'Change in points per minute within each game and matching sensitivity settings. This is not a clinical measure.'}]
    slope_week=slope*7
    features=[max(0,goal-latest),min(25.0,max(0.0,slope_week)),frequency,min(30.0,variability),game_trend,min(40.0,minutes)]
    out={'points':points,'evidence':evidence,'latest':round(latest,1),'trend_per_week':round(slope_week,2),'practice_days':len(points),'game_sessions':len(games),'goal':goal,'features':features}
    if latest>=goal:return {**out,'status':'reached','reason':'The latest daily average has reached this practice goal. This does not establish medical recovery.'}
    if len(points)<4 or xs[-1]<6:return {**out,'status':'insufficient','reason':'More comparable history is needed: at least four scored days spanning one week.'}
    if slope_week<.3:return {**out,'status':'unclear','reason':'The observed trend is flat or declining. A responsible time estimate cannot be shown.'}
    if minutes>45 or variability>35 or frequency<1 or goal-latest>65:return {**out,'status':'outside_range','reason':'These inputs fall outside the synthetic training range; no time estimate is shown.'}
    forecast=estimate(features)
    if forecast['days']>180:return {**out,'status':'outside_range','reason':'The scenario extends beyond this prototype’s 180-day horizon.'}
    return {**out,'status':'estimated','forecast':forecast}

def example(goal):
    rng=random.Random(41);today=datetime.now(timezone.utc).date();points=[]
    for day in range(21):
        if day%7==6:continue
        points.append({'day':str(today-timedelta(days=20-day)),'score':round(44+day*.9+rng.uniform(-2,2),1),'minutes':12,'sessions':1})
    games=[{'game':game,'score':20+i*3,'seconds':90,'settings':'example'} for game in ('fruit','dino','balloon') for i in range(8)]
    return summarise(points,games,goal)

def register_prediction_routes(app,db):
    with db.get_connection() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS game_sessions_v1(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL DEFAULT 1,game TEXT NOT NULL,source TEXT NOT NULL,score REAL NOT NULL,reps INTEGER NOT NULL,seconds REAL NOT NULL,settings TEXT NOT NULL,ended_at TEXT NOT NULL)''');conn.commit()
        conn.execute('''CREATE TABLE IF NOT EXISTS game_best_scores(user_id INTEGER NOT NULL DEFAULT 1,game TEXT NOT NULL,score INTEGER NOT NULL,origin TEXT NOT NULL DEFAULT 'browser',updated_at TEXT NOT NULL,PRIMARY KEY(user_id,game))''');conn.commit()
    def best_scores(conn):
        scores=dict.fromkeys(('fruit','dino','balloon'),0)
        for row in conn.execute('SELECT game,MAX(score) AS score FROM (SELECT game,score FROM game_best_scores WHERE user_id=1 UNION ALL SELECT game,score FROM game_sessions_v1 WHERE user_id=1) GROUP BY game'):
            if row['game'] in scores:scores[row['game']]=int(row['score'])
        return scores
    @app.route('/api/game-best-scores',methods=['GET','POST'])
    def game_best_scores():
        with db.get_connection() as conn:
            if request.method=='POST':
                payload=request.get_json(silent=True)
                if not isinstance(payload,dict) or not isinstance(payload.get('scores'),dict):return jsonify(error='Invalid scores'),400
                scores=payload['scores']
                if any(game not in ('fruit','dino','balloon') or type(score) is not int or not 0<=score<=1000000 for game,score in scores.items()):return jsonify(error='Invalid scores'),400
                for game,score in scores.items():
                    conn.execute('INSERT INTO game_best_scores(user_id,game,score,updated_at) VALUES(1,?,?,?) ON CONFLICT(user_id,game) DO UPDATE SET score=MAX(game_best_scores.score,excluded.score),updated_at=excluded.updated_at',(game,score,datetime.now(timezone.utc).isoformat()))
                conn.commit()
            return jsonify(scores=best_scores(conn))
    @app.post('/api/game-sessions')
    def record_game():
        d=request.get_json(silent=True) or {}
        if not isinstance(d,dict):return jsonify(error='Invalid session'),400
        try:
            if d.get('game') not in ('fruit','dino','balloon') or d.get('source') not in ('mqtt','serial','simulate','manual'):raise ValueError()
            if not re.fullmatch(r'[A-Za-z0-9-]{12,80}',str(d.get('id',''))):raise ValueError()
            score=float(d['score']);seconds=float(d['seconds']);reps=int(d['reps'])
            if not all(math.isfinite(v) for v in (score,seconds)) or not 0<=score<=1000000 or not 0<=seconds<=14400 or not 0<=reps<=100000:raise ValueError()
            settings_data=d.get('settings',{})
            if not isinstance(settings_data,dict):raise ValueError()
            settings=json.dumps(settings_data,sort_keys=True,separators=(',',':'))
            if len(settings)>2000:raise ValueError()
        except (ValueError,TypeError,KeyError,OverflowError):return jsonify(error='Invalid game-session data'),400
        with db.get_connection() as conn:
            calibration=conn.execute('SELECT flex_calibration_json,fsr_baseline,fsr_contact_threshold FROM calibrations WHERE user_id=1 ORDER BY updated_at DESC LIMIT 1').fetchone()
            settings_data['_calibration']=list(calibration) if calibration else None
            settings=json.dumps(settings_data,sort_keys=True,separators=(',',':'))
            conn.execute('INSERT OR IGNORE INTO game_sessions_v1(id,game,source,score,reps,seconds,settings,ended_at) VALUES(?,?,?,?,?,?,?,?)',(d['id'],d['game'],d['source'],score,reps,seconds,settings,datetime.now(timezone.utc).isoformat()));conn.commit()
        return jsonify(saved=True)
    @app.get('/api/prediction')
    def prediction():
        exercise=request.args.get('exercise','grasp_release');mode=request.args.get('mode','live')
        try:goal=int(request.args.get('goal','80'))
        except ValueError:return jsonify(error='Invalid goal'),400
        if exercise not in EXERCISES or mode not in ('live','example','prototype') or goal not in (70,80,90):return jsonify(error='Invalid forecast options'),400
        meta=artifact();report={k:meta[k] for k in ('version','training','samples','holdout_samples','holdout_mae_days')}
        if mode=='example':result=example(goal)
        else:
            cutoff=(datetime.now(timezone.utc)-timedelta(days=90)).isoformat()[:10]
            sources = "('simulate')" if mode=='prototype' else "('mqtt','serial')"
            with db.get_connection() as conn:
                latest=conn.execute(f"SELECT protocol_version,calibration_json FROM guided_sessions WHERE user_id=1 AND exercise_key=? AND data_source IN {sources} AND status='completed' AND average_pct IS NOT NULL AND attempt_count>0 ORDER BY started_at DESC LIMIT 1",(exercise,)).fetchone()
                points=[]
                if latest:
                    rows=conn.execute(f"SELECT local_day,protocol_version,calibration_json,weighted_score_sum,attempt_count,active_seconds FROM guided_sessions WHERE user_id=1 AND exercise_key=? AND data_source IN {sources} AND status='completed' AND attempt_count>0 AND average_pct IS NOT NULL AND local_day>=? ORDER BY local_day",(exercise,cutoff)).fetchall()
                    signature=comparable_session(latest,exercise);days={}
                    for row in rows:
                        if comparable_session(row,exercise)!=signature:continue
                        day=days.setdefault(row['local_day'],{'sum':0,'attempts':0,'minutes':0,'sessions':0})
                        day['sum']+=row['weighted_score_sum'];day['attempts']+=row['attempt_count'];day['minutes']+=row['active_seconds']/60;day['sessions']+=1
                    points=[{'day':day,'score':round(value['sum']/value['attempts'],1),'minutes':value['minutes'],'sessions':value['sessions']} for day,value in sorted(days.items())]
                games=[dict(r) for r in conn.execute(f"SELECT game,score,seconds,settings FROM game_sessions_v1 WHERE user_id=1 AND source IN {sources} AND ended_at>=? ORDER BY ended_at",(cutoff,)).fetchall()]
            result=summarise(points,games,goal)
        return jsonify(**result,mode=mode,exercise=exercise,model=report,medical_recovery_prediction=False,limitations=['Trained only on invented practice trajectories, not clinical recovery outcomes.','Model interval is tree-output spread, not a validated confidence interval.','Glove scores and game points cannot measure recovery or independence.','Only comparable completed sessions from one comparable scored calibration and protocol are used.'])
