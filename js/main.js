"use strict";
const settings = {
  game_name: "PointRanks",
  savefile_name: "PointRanksSave",
  save: true,
  auto_save: 10,
  fps: 60
};

let [player, nosave] = [{}, {}];

function getDefaultPlayerValues() {
  let Player = {};
  Player.points = [];
  Player.pmt = x(1);
  Player.pfnr = x(0);
  Player.firstVisit = Date.now();

  return Player;
}
function setNosaveValues() {
  nosave.lastLoop = Date.now();
  nosave.lastSave = Date.now();
}

const rankNames = [' ', 'Super', 'Mega', 'Ultra', 'Omega', 'Extreme', 'Insane', 'Void', 'Impossible', 'Royal', 'Divine', 'Epic', 'Legendary', 'Mythical', 
                   'Unique', 'Colossal', 'Grand', 'Exotic', 'Ethereal', 'Crazy', 'Mysterious', 'Cosmic', 'Brilliant', 'Astonishing', 'Delightful',
                   'Copacetic'];

const main_functions = {
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
          this.update($($('#points-container').children()[index]), `<span style="color: rgb(${r}, ${g}, ${b})">${preword} Points: ${abb_int(value)}</span>`);
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
    rank() {
      this.update($('#rank'), `For next rank: <span class="size-150">${abb_int(player.pfnr)}</span>`);
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

const get = main_functions.get;
const updates = main_functions.updates;
const gameFunctions = main_functions.gameFunctions;

function mainLoop() {
  const time = (Date.now() - player.firstVisit);
  player.pmt = time > 3600000 ? x(3).pow(x(time).div(3600000).log(10)) : x(1);

  player.points[0] = player.points[0].plus(x(1).plus(player.points.length >= 2 ? player.points[1] : 0).div(settings.fps).times(player.pmt));
  player.points.forEach((value, index) => {
    const req = x(10).pow(x(index + 1).min(5)).times(x(2).pow(x(index - 4).max(0))).softcap('5e6', 0.5, 'pow').softcap('1e8', 0.5, 'pow');
    if (index === player.points.length - 1) player.pfnr = req;
    if (player.points[index].gte(req)) {
      player.points[index] = player.points[index].minus(req);
      if (index === player.points.length - 1) {
        gameFunctions.add_point_layer();
      }
      player.points[index + 1] = player.points[index + 1].plus(x(1).plus(index < player.points.length - 2 ? player.points?.[index + 2] : 0).times(player.pmt));
    }
  });
  updates.updateAll();
  if (Date.now() >= nosave.lastSave + settings.auto_save * 1e3) {
    save();
    nosave.lastSave = Date.now();
  }
  
}

$(window).on('load', () => {
  setNosaveValues();
  player = getDefaultPlayerValues();
  loadToPlayer();
  fixValues();

  $('#export').on('click', () => {
    const save = localStorage.getItem(settings.game_name),
              date = new Date(),
              post_name = date.toLocaleDateString() + ' ' + date.toLocaleTimeString().replace(new RegExp(':', 'g'), '-');
    downloadFile(save, settings.savefile_name + ' ' + post_name + '.txt');
  });

  $('#import').on('click', () => {
    const text = prompt('Paste your text here. Your current save will be overwritten.');
    if (text) {
      player = getDefaultPlayerValues();
      loadToPlayer(text);
      save();
      location.reload();
    }
  });

  player.points.forEach(()=>{gameFunctions.add_point_layer(!player.points.length)});
  if (!player.points.length) gameFunctions.add_point_layer();
  updates.updateAll();

  setInterval(mainLoop, getLoopInterval());
});