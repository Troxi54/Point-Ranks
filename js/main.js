const settings = {
  game_name: "PointRanks",
  savefile_name: "PointRanksSave",
  save: true,
  auto_save: 10,
  fps: 60
}

let [player, nosave] = [{}, {}];

function getDefaultPlayerValues() {
  let Player = {};
  Player.points = [];
  Player.pmt = x(1);
  Player.firstVisit = Date.now();

  return Player;
}
function setNosaveValues() {
  nosave.lastLoop = Date.now();
  nosave.lastSave = Date.now();
}

const rankNames = [' ', 'Super', 'Mega', 'Ultra', 'Omega', 'Extreme', 'Insane', 'Void', 'Impossible', 'Royal', 'Divine', 'Epic', 'Legendary', 'Mythical', 
                   'Unique', 'Colossal', 'Grand', 'Exotic', 'Ethereal'];

main_functions = {
  updates: {  // update HTML
    update(element, text) {
      if (element.html() !== text) element.html(text);
    },
    updatePointRanks() {
      player.points.forEach((value, index) => {
        // good ones are: 19, 22
        const code = 50;
        if (index < 6) {
          let [r, g, b] = [SimpleFastCounter32(MurmurHash3(`r${index} ${code}`)())() * 255, 
            SimpleFastCounter32(MurmurHash3(`g${index} ${code}`)())() * 255,
            SimpleFastCounter32(MurmurHash3(`b${index} ${code}`)())() * 255];
          [r, g, b] = [Math.floor(r), Math.floor(g), Math.floor(b)];
          const preword = rankNames?.[index] || index;
          this.update($($('#points-container').children()[index]), `<span style="color: rgb(${r}, ${g}, ${b})">${preword} Points: ${abb_int(value)}</span>`)
        } else {
          let [r, r2, g, g2, b, b2] = [SimpleFastCounter32(MurmurHash3(`r${index} ${code}`)())() * 255, 
            SimpleFastCounter32(MurmurHash3(`r-2 ${index} ${code}`)())() * 255,
            SimpleFastCounter32(MurmurHash3(`g${index} ${code}`)())() * 255, 
            SimpleFastCounter32(MurmurHash3(`g-2 ${index} ${code}`)())() * 255,
            SimpleFastCounter32(MurmurHash3(`b${index} ${code}`)())() * 255,
            SimpleFastCounter32(MurmurHash3(`b-2 ${index} ${code}`)())() * 255];
          [r, r2, g, g2, b, b2] = [Math.floor(r), Math.floor(r2), Math.floor(g), Math.floor(g2), Math.floor(b), Math.floor(b2)];
          const preword = rankNames?.[index] || index;
          this.update($($('#points-container').children()[index]), 
                      `<span class="text-gradient" style="background: linear-gradient(rgb(${r}, ${g}, ${b}), rgb(${r2}, ${g2}, ${b2}))">${preword} Points: ${abb_int(value)}</span>`);
        }
      });
    },
    time() {
      this.update($('#time'), `${player.pmt.gt(1) ? `<span class="dark">${abb(player.pmt, 3)}x</span>` : ''}<br> ${msToTime(Date.now() - player.firstVisit)}`);
    },
    updateAll() {
      for (const upd in updates) {
        if (!['update', 'updateAll'].includes(upd)) updates[upd]();
      }
    }
  },
  gameFunctions: {
    add_point_layer(push = true) {
      if (push) player.points.push(x(0));
      const layer = $(`<p class="points" id="points-${player.points.length}"></p>`);
      $('#points-container').append(layer);
    }
  }
};

get = main_functions.get;
updates = main_functions.updates;
gameFunctions = main_functions.gameFunctions;

function mainLoop() {
  const time = (Date.now() - player.firstVisit);
  player.pmt = time > 3600000 ? x(3).pow(x(time).div(3600000).log(10)) : x(1);

  player.points[0] = player.points[0].plus(x(1).plus(player.points.length >= 2 ? player.points[1] : 0).div(settings.fps).times(player.pmt));
  player.points.forEach((value, index) => {
    const req = x(10).pow(index + 1);
    if (player.points[index].gte(req)) {
      player.points[index] = player.points[index].minus(req);
      if (index === player.points.length - 1) {
        gameFunctions.add_point_layer();
      }
      player.points[index + 1] = player.points[index + 1].plus(x(1).plus(index < player.points.length - 2 ? player.points?.[index + 2] : 0).times(player.pmt));
    }
  })
  updates.updateAll();
  if (Date.now() >= nosave.lastSave + settings.auto_save * 1e3) {
    save();
    nosave.lastSave = Date.now();
  }
  
}

$(document).ready(function() {
  setNosaveValues();
  player = getDefaultPlayerValues();
  loadToPlayer();
  fixValues();

  player.points.forEach(()=>{gameFunctions.add_point_layer(!player.points.length)});
  if (!player.points.length) gameFunctions.add_point_layer();
  updates.updateAll();

  setInterval(mainLoop, getLoopInterval());
});