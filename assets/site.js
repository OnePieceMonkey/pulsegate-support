(function(){
'use strict';

var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var STRINGS = window.PULSEGATE_STRINGS || { hit: 'Perfect', miss: 'Missed' };

(function heroCta(){
  var mount = document.getElementById('hero-cta');
  if(!mount) return;
  var url = window.PULSEGATE_APP_STORE_URL;
  if(url){
    var a = document.createElement('a');
    a.className = 'appstore-cta';
    a.href = url;
    a.textContent = mount.dataset.ctaLabel || 'Download on the App Store';
    mount.replaceWith(a);
  }
})();

(function backgroundPulses(){
  var canvas = document.getElementById('pulse-canvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, DPR;

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var points = [];
  function initPoints(){
    points = [];
    var count = Math.min(64, Math.floor((W * H) / 24000));
    for(var i=0;i<count;i++){
      var y = Math.random() * H;
      points.push({ x: Math.random() * W, baseY: y, y: y, phase: Math.random()*Math.PI*2 });
    }
  }

  function handleResize(){ resize(); initPoints(); }
  window.addEventListener('resize', handleResize);
  resize(); initPoints();

  var pulses = [];
  var lastSpawn = 0;
  function spawnPulse(now){
    if(!points.length) return;
    var p = points[Math.floor(Math.random() * points.length)];
    pulses.push({ x: p.x, y: p.y, maxR: 90 + Math.random()*70, born: now });
  }

  var scrollOffset = 0;
  window.addEventListener('scroll', function(){
    scrollOffset = window.scrollY * 0.05;
  }, { passive: true });

  function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }

  function draw(now){
    ctx.clearRect(0, 0, W, H);

    points.forEach(function(p){
      if(!REDUCED) p.y = p.baseY + Math.sin(now/2200 + p.phase) * 5;
    });

    function drawY(y){ return y - scrollOffset; }

    ctx.lineWidth = 1;
    for(var i=0;i<points.length;i++){
      for(var j=i+1;j<points.length;j++){
        var a = points[i], b = points[j];
        var dx = a.x - b.x, dy = drawY(a.y) - drawY(b.y);
        var dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 130){
          var alpha = (1 - dist/130) * 0.10;
          ctx.strokeStyle = 'rgba(139,233,253,' + alpha + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, drawY(a.y));
          ctx.lineTo(b.x, drawY(b.y));
          ctx.stroke();
        }
      }
    }

    points.forEach(function(p){
      ctx.fillStyle = 'rgba(139,233,253,0.32)';
      ctx.beginPath();
      ctx.arc(p.x, drawY(p.y), 1.6, 0, Math.PI*2);
      ctx.fill();
    });

    pulses = pulses.filter(function(pl){ return (now - pl.born) < 1500; });
    pulses.forEach(function(pl){
      var t = (now - pl.born) / 1500;
      var r = pl.maxR * easeOutCubic(t);
      var alpha = (1-t) * 0.45;
      ctx.strokeStyle = 'rgba(139,233,253,' + alpha + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(pl.x, drawY(pl.y), r, 0, Math.PI*2);
      ctx.stroke();
    });

    if(!REDUCED){
      if(now - lastSpawn > 900 + Math.random()*900){
        spawnPulse(now);
        lastSpawn = now;
      }
      requestAnimationFrame(draw);
    }
  }
  requestAnimationFrame(draw);
})();

(function tilt(){
  if(!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
  if(REDUCED) return;

  function attach(el, max, scale){
    function onMove(e){
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width/2;
      var cy = rect.top + rect.height/2;
      var dx = (e.clientX - cx) / (rect.width/2);
      var dy = (e.clientY - cy) / (rect.height/2);
      var img = el.querySelector('img');
      if(!img) return;
      img.style.transform = 'perspective(900px) rotateX(' + (-dy*max) + 'deg) rotateY(' + (dx*max) + 'deg) scale(' + scale + ')';
    }
    function onLeave(){
      var img = el.querySelector('img');
      if(img) img.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  }

  var icon = document.getElementById('icon-tilt');
  if(icon) attach(icon, 14, 1.04);
  document.querySelectorAll('.tilt-card').forEach(function(card){
    attach(card, 10, 1.03);
  });
})();

(function mechanicDemo(){
  var svg = document.getElementById('mechanic-svg');
  if(!svg) return;
  var gateArc = document.getElementById('gate-arc');
  var pointer = document.getElementById('pointer');
  var pulseRing = document.getElementById('pulse-ring');
  var caption = document.getElementById('mechanic-caption');

  var CX = 200, CY = 200, GATE_R = 150, POINTER_R = 170;
  var GATE_ARC_WIDTH = 50;
  var ANGULAR_SPEED = 85;

  function polarToXY(r, angleDeg){
    var rad = (angleDeg - 90) * Math.PI / 180;
    return { x: CX + r*Math.cos(rad), y: CY + r*Math.sin(rad) };
  }
  function describeArc(r, startAngle, endAngle){
    var start = polarToXY(r, endAngle);
    var end = polarToXY(r, startAngle);
    var largeArc = ((endAngle - startAngle + 360) % 360) <= 180 ? 0 : 1;
    return 'M ' + start.x + ' ' + start.y + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 0 ' + end.x + ' ' + end.y;
  }
  function norm360(a){ return ((a % 360) + 360) % 360; }

  function setPointer(angleDeg){
    var p = polarToXY(POINTER_R, angleDeg);
    pointer.setAttribute('x2', p.x);
    pointer.setAttribute('y2', p.y);
  }
  function setGate(angleDeg){
    gateArc.setAttribute('d', describeArc(GATE_R, angleDeg - GATE_ARC_WIDTH/2, angleDeg + GATE_ARC_WIDTH/2));
    gateArc.setAttribute('stroke', '#fff');
  }
  function flashGate(color){
    gateArc.setAttribute('stroke', color);
  }
  function showCaption(text, cls){
    caption.textContent = text;
    caption.className = 'mechanic-caption mono show' + (cls ? ' ' + cls : '');
  }
  function hideCaption(){
    caption.className = 'mechanic-caption mono';
  }

  var gateAngle = 40;
  var pointerAngle = 0;
  var nextOutcomeIsHit = true;
  var tapAngle = 0;
  setGate(gateAngle);
  setPointer(pointerAngle);

  function planNextTap(){
    nextOutcomeIsHit = Math.random() < 0.75;
    if(nextOutcomeIsHit){
      var margin = GATE_ARC_WIDTH/2 - 8;
      tapAngle = norm360(gateAngle + (Math.random()*2 - 1) * margin);
    } else {
      var side = Math.random() < 0.5 ? -1 : 1;
      var offset = GATE_ARC_WIDTH/2 + 14 + Math.random()*14;
      tapAngle = norm360(gateAngle + side*offset);
    }
  }
  planNextTap();

  if(REDUCED){
    setGate(80);
    flashGate('var(--perfect)');
    setPointer(80);
    pulseRing.setAttribute('r', String(GATE_R));
    pulseRing.setAttribute('opacity', '0.6');
    pulseRing.setAttribute('stroke', 'var(--perfect)');
    showCaption(STRINGS.hit, 'hit');
    return;
  }

  var STATE_ROTATE = 'rotate', STATE_EXPAND = 'expand', STATE_RESOLVE = 'resolve', STATE_RESET = 'reset';
  var state = STATE_ROTATE;
  var stateStart = 0;

  function tick(now){
    var dt;
    if(!tick.last) tick.last = now;
    dt = (now - tick.last) / 1000;
    tick.last = now;

    if(state === STATE_ROTATE){
      pointerAngle = norm360(pointerAngle + ANGULAR_SPEED * dt);
      setPointer(pointerAngle);
      var remaining = norm360(tapAngle - pointerAngle) / ANGULAR_SPEED;
      if(remaining < dt * 1.5){
        pointerAngle = tapAngle;
        setPointer(pointerAngle);
        state = STATE_EXPAND;
        stateStart = now;
        pulseRing.setAttribute('opacity', '0.9');
        pulseRing.setAttribute('stroke', 'var(--thread)');
      }
    } else if(state === STATE_EXPAND){
      var t = Math.min(1, (now - stateStart) / 700);
      var eased = 1 - Math.pow(1-t, 3);
      pulseRing.setAttribute('r', String(GATE_R * eased));
      if(t >= 1){
        state = STATE_RESOLVE;
        stateStart = now;
        if(nextOutcomeIsHit){
          flashGate('var(--perfect)');
          pulseRing.setAttribute('stroke', 'var(--perfect)');
          showCaption(STRINGS.hit, 'hit');
        } else {
          flashGate('var(--fail)');
          pulseRing.setAttribute('stroke', 'var(--fail)');
          showCaption(STRINGS.miss, 'miss');
        }
      }
    } else if(state === STATE_RESOLVE){
      if(now - stateStart > 650){
        state = STATE_RESET;
        stateStart = now;
      }
    } else if(state === STATE_RESET){
      var ft = Math.min(1, (now - stateStart) / 400);
      pulseRing.setAttribute('opacity', String(0.9 * (1-ft)));
      if(ft >= 1){
        pulseRing.setAttribute('r', '0');
        pulseRing.setAttribute('opacity', '0');
        hideCaption();
        gateAngle = norm360(gateAngle + 70 + Math.random()*140);
        setGate(gateAngle);
        planNextTap();
        state = STATE_ROTATE;
      }
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

})();
