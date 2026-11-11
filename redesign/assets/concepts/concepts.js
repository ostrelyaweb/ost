const wallControls = document.getElementById('vanguard-controls');

if (wallControls) {
  const moduleWidth = 600;
  const moduleHeight = 2700;
  const elevationHeight = moduleHeight / 10;
  const finsPerModule = 6;
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const profiles = {
    flow: { label: 'Flow', amplitude: 18, frequency: 1.05 },
    ripple: { label: 'Ripple', amplitude: 12, frequency: 1.85 },
    line: { label: 'Line', amplitude: 0, frequency: 1 }
  };
  const finishes = {
    chalk: { label: 'Chalk', colors: ['#a9a598', '#878477', '#d4cfc1', '#fcf8ed'] },
    sand: { label: 'Sand', colors: ['#88725e', '#795f49', '#ba9371', '#e6c9a9'] },
    graphite: { label: 'Graphite', colors: ['#404441', '#262926', '#585f5b', '#848c86'] }
  };
  const modules = document.getElementById('vanguard-modules');
  const elevation = document.getElementById('vanguard-elevation');
  const wall = document.getElementById('vanguard-wall');
  const wallTitle = document.getElementById('vanguard-wall-title');
  const ribs = document.getElementById('vanguard-ribs');
  const widthOutput = document.getElementById('vanguard-width');
  const dimension = document.getElementById('vanguard-dimension');
  const selection = document.getElementById('vanguard-selection');
  const download = document.getElementById('vanguard-download');

  function getSelection() {
    const count = modules.valueAsNumber;
    return {
      count,
      width: count * moduleWidth,
      profile: profiles[wallControls.elements.profile.value],
      finish: finishes[wallControls.elements.finish.value]
    };
  }

  function drawFins(count, width, profile) {
    const finCount = count * finsPerModule;
    const pitch = width / finCount;
    const paths = document.createDocumentFragment();
    for (let index = -2; index < finCount + 2; index++) {
      const x = index * pitch;
      const phase = (index / finsPerModule) * .62;
      const left = [];
      const right = [];
      for (let step = 0; step <= 30; step++) {
        const progress = step / 30;
        const y = progress * elevationHeight;
        const bend = Math.sin(progress * Math.PI * 2 * profile.frequency + phase);
        const envelope = Math.sin(progress * Math.PI);
        const edge = x + bend * profile.amplitude * envelope;
        const thickness = pitch * (.72 + .12 * bend * envelope);
        left.push(edge.toFixed(2) + ',' + y);
        right.unshift((edge + thickness).toFixed(2) + ',' + y);
      }
      const path = document.createElementNS(svgNamespace, 'path');
      path.setAttribute('d', 'M' + left.join(' L') + ' L' + right.join(' L') + ' Z');
      paths.append(path);
    }
    ribs.replaceChildren(paths);
  }

  let previousGeometry = '';
  function updateWall() {
    const { count, width, profile, finish } = getSelection();
    const elevationWidth = width / 10;
    const widthLabel = (width / 1000).toFixed(1) + ' m';
    const geometry = count + ':' + profile.label;
    if (geometry !== previousGeometry) {
      wall.setAttribute('viewBox', '0 0 ' + elevationWidth + ' ' + elevationHeight);
      elevation.style.setProperty('--wall-ratio', elevationWidth / elevationHeight);
      drawFins(count, elevationWidth, profile);
      previousGeometry = geometry;
    }
    ['--rib-base', '--rib-shadow', '--rib-face', '--rib-edge'].forEach((property, index) => {
      wall.style.setProperty(property, finish.colors[index]);
    });
    wallTitle.textContent = profile.label + ' profile in ' + finish.label + ', ' + widthLabel + ' wide';
    widthOutput.value = widthLabel;
    dimension.textContent = widthLabel;
    modules.setAttribute('aria-valuetext', widthLabel + ', ' + count + ' modules');
    selection.textContent = count + ' modules · 600 × 2,700 mm each';
  }

  wallControls.addEventListener('input', updateWall);
  download.addEventListener('click', () => {
    const { count, width, profile, finish } = getSelection();
    const spec = [
      'VANGUARD / WAVE 01',
      'Concept selection for the project brief',
      '',
      'Fin profile: ' + profile.label,
      'Finish: ' + finish.label,
      'Wall width: ' + width + ' mm',
      'Wall height: ' + moduleHeight + ' mm',
      'Modules: ' + count + ' at ' + moduleWidth + ' × ' + moduleHeight + ' mm each',
      '',
      'Fictional product concept by Ostrelya.'
    ].join('\n');
    const url = URL.createObjectURL(new Blob([spec], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vanguard-wave-01-spec.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  updateWall();
  download.disabled = false;
}
