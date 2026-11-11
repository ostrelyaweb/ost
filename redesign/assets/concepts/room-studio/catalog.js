export const room = { width: 10, depth: 8, maxItems: 60 };

export const floors = {
  oak: { label: 'Honey oak', color: '#ad8a62', pattern: 'planks' },
  limestone: { label: 'Ivory limestone', color: '#c5bca8', pattern: 'tiles' },
  concrete: { label: 'Smoked concrete', color: '#888981', pattern: 'concrete' }
};

export const lighting = {
  daylight: { label: 'Daylight', sky: '#fff3df', sun: '#fff2db', strength: 2.35, fill: 1.55 },
  evening: { label: 'Warm evening', sky: '#f7c995', sun: '#ffc17d', strength: 1.45, fill: .95 },
  gallery: { label: 'Gallery light', sky: '#dde9f8', sun: '#ebf4ff', strength: 1.8, fill: 1.65 }
};

export const finishes = {
  chalk: { label: 'Chalk', color: '#e5dfce' },
  sand: { label: 'Sand', color: '#bda584' },
  walnut: { label: 'Walnut', color: '#855d43' },
  moss: { label: 'Moss', color: '#737955' },
  ink: { label: 'Ink', color: '#414641' },
  clay: { label: 'Terracotta', color: '#a85f48' },
  brass: { label: 'Brushed brass', color: '#a98952' }
};

export const categories = {
  furniture: { label: 'Seating', icon: '01', designs: ['lounge', 'chair', 'sofa', 'bench'], finishes: ['chalk','sand','moss','ink','clay','walnut'] },
  table: { label: 'Tables', icon: '02', designs: ['coffee', 'side', 'reception'], finishes: ['walnut','sand','chalk','ink','brass'] },
  wall: { label: 'Walls & partitions', icon: '03', designs: ['wave', 'plaster', 'slats'], finishes: ['chalk','sand','walnut','ink','clay','moss'] },
  light: { label: 'Lighting', icon: '04', designs: ['pendant', 'floorLamp', 'track'], finishes: ['brass','ink','chalk','walnut'] },
  decor: { label: 'Decor', icon: '05', designs: ['planter', 'vase', 'rug'], finishes: ['clay','chalk','ink','moss','sand','walnut'] },
  installation: { label: 'Installations', icon: '06', designs: ['sculpture', 'display', 'screen'], finishes: ['chalk','ink','clay','brass','walnut','moss'] }
};

export const designs = {
  lounge: { label: 'Arc lounge chair', size: [1.04, 1.03] },
  chair: { label: 'Frame chair', size: [.75, .76] },
  sofa: { label: 'Lowline sofa', size: [2.6, 1.03] },
  bench: { label: 'Oak bench', size: [2, .63] },
  coffee: { label: 'Round coffee table', size: [1.28, 1.28], round: true },
  side: { label: 'Column side table', size: [.65, .65], round: true },
  reception: { label: 'Reception desk', size: [2.55, .82] },
  wave: { label: 'Wave 01 wall', size: [3.6, .22] },
  plaster: { label: 'Plaster partition', size: [2.4, .16] },
  slats: { label: 'Oak slat screen', size: [2.4, .16] },
  pendant: { label: 'Dome pendant', size: [.8, .8], round: true },
  floorLamp: { label: 'Shade floor lamp', size: [.55, .55], round: true },
  track: { label: 'Three-light track', size: [1.7, .32] },
  planter: { label: 'Olive tree', size: [.76, .76], round: true },
  vase: { label: 'Ceramic vessel', size: [.42, .42], round: true },
  rug: { label: 'Woven rug', size: [3.8, 2.55] },
  sculpture: { label: 'Loop sculpture', size: [.85, .75] },
  display: { label: 'Display plinth', size: [.75, .75] },
  screen: { label: 'Exhibition screen', size: [1.7, .42] }
};

export function createItem(category, design, finish, x = 0, z = 0, angle = 0) {
  return { id: crypto.randomUUID(), category, design, finish, x, z, angle,
    width: designs[design].size[0], height: 2.7, on: true };
}

export function starterRoom() {
  const create = createItem;
  const wave = create('wall','wave','chalk',.05,-3.87);
  wave.width = 9.7;
  wave.height = 3.05;
  const left = create('wall','plaster','sand',-4.9,-.5,90);
  left.width = 6.6;
  left.height = 3.05;
  return { floor: 'oak', light: 'daylight', items: [
    wave, left,
    create('decor','rug','sand',.45,.85),
    create('furniture','sofa','moss',.35,-.45),
    create('furniture','lounge','clay',-1.28,1.35,63),
    create('furniture','lounge','chalk',2.05,1.45,300),
    create('table','coffee','walnut',.47,1.03),
    create('table','side','chalk',2.25,-.15),
    create('decor','planter','clay',-3.95,-2.8),
    create('decor','planter','moss',4.3,-2.8),
    create('table','reception','walnut',2.93,-2.58),
    create('light','pendant','brass',.47,1.03),
    create('light','floorLamp','ink',-2.2,-.25),
    create('installation','sculpture','clay',-3.62,1.45)
  ] };
}

export function footprint(item) {
  const [width, depth] = designs[item.design].size;
  return [item.category === 'wall' ? item.width : width, depth];
}
