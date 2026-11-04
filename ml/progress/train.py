"""Train an experimental practice-goal simulator; never a clinical recovery model.
The labels are invented by the simulator below. Holdout error only measures how
well the forest approximates that simulator, not performance on real patients.
"""
import json, math
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

FEATURES=['target_gap_pct','trend_pct_per_week','practice_days_per_week','score_variability','game_trend_pct','practice_minutes_per_day']
def train(output):
    rng=np.random.default_rng(1947); n=12000
    X=np.column_stack([rng.uniform(0,65,n),rng.uniform(.3,20,n),rng.uniform(1,7,n),rng.uniform(0,25,n),rng.uniform(-50,50,n),rng.uniform(.2,30,n)])
    # An engineering scenario, not a physiological law or clinical ground truth.
    rate=np.maximum(.08,(X[:,1]/7*.65+X[:,2]*.025+X[:,5]*.008+X[:,4]*.0006)*(1-X[:,3]/100)*rng.lognormal(0,.25,n))
    y=np.minimum(365,X[:,0]/rate)
    np.savetxt(Path(output).with_name("synthetic_training.csv"),np.column_stack([X,y]),delimiter=",",header=",".join(FEATURES+["synthetic_days_to_goal"]),comments="",fmt="%.5f")
    a,b,c,d=train_test_split(X,y,test_size=.2,random_state=21)
    model=RandomForestRegressor(n_estimators=48,max_depth=9,min_samples_leaf=12,random_state=22,n_jobs=2).fit(a,c)
    trees=[]
    for estimator in model.estimators_:
        t=estimator.tree_;trees.append({'feature':t.feature.tolist(),'threshold':t.threshold.tolist(),'left':t.children_left.tolist(),'right':t.children_right.tolist(),'value':t.value[:,0,0].tolist()})
    report={'version':'practice-simulator-v1','features':FEATURES,'training':'Synthetic data only; no patient recovery outcomes','samples':n,'holdout_samples':len(b),'holdout_mae_days':round(mean_absolute_error(d,model.predict(b)),2),'seed':1947,'trees':trees}
    Path(output).write_text(json.dumps(report,separators=(',',':')),encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='trees'},indent=2))
if __name__=='__main__': train(Path(__file__).with_name('model.json'))
