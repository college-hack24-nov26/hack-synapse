const assert=require('assert'),fs=require('fs'),vm=require('vm');
const nodes=new Map(),drawing=new Proxy({}, {get:()=>()=>{}});
function node(id){if(!nodes.has(id))nodes.set(id,{style:{},textContent:'',disabled:false,classList:{contains:()=>true,toggle(){}},setAttribute(){},getContext:()=>drawing});return nodes.get(id);}
let now=100;
const sandbox={console,Math,Number,String,performance:{now:()=>now},requestAnimationFrame(){},window:{devicePixelRatio:1},document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('web/static/js/games.js','utf8')+'\nthis.Games=NeuroGloveGames;',sandbox);
const packet=index=>({timestamp:++now,data_source:'mqtt',mqtt_connected:true,processed:{flex:{index},fsr:{pressure_pct:0}}});
const game=new sandbox.Games('gameCanvas');
game.selectGame('dino');game.updateTelemetry(packet(35));game.selectDinoFinger('index');game.startGame();
game.updateTelemetry(packet(35));assert.equal(game.dino.velocity,0,'Resting at nonzero flex does not jump');
game.updateTelemetry(packet(60));assert(game.dino.velocity>0,'Additional flexion above a nonzero resting level jumps');
game.dino.height=0;game.dino.velocity=0;
game.updateTelemetry(packet(60));assert.equal(game.dino.velocity,0,'A held finger cannot repeat jumps');
game.updateTelemetry(packet(35));game.updateTelemetry(packet(60));assert(game.dino.velocity>0,'Returning to the natural rest level rearms');
game.stopGame();game.updateTelemetry(packet(35));game.selectDinoFinger('index');
game.updateTelemetry(packet(60));assert(!game.isRunning,'Setup movements do not start gameplay');
game.updateTelemetry(packet(35));game.startGame();game.updateTelemetry(packet(60));assert(game.dino.velocity>0,'Setup movements do not consume the first jump');
console.log('PASS: natural resting flex, repeat jumps, held-finger hysteresis, and setup gesture isolation');
