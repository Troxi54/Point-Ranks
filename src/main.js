"use strict";
const settings = {
  game_name: "PointRanks",
  savefile_name: "PointRanksSave",
  save: true,
  auto_save: 10,
  fps: 60,
};

const gameSettings = {
  pointifyRequirement: x(1e18),
};

let [player, nosave] = [{}, {}];

function getDefaultPlayerValues() {
  return {
    points: [],
    firstVisit: Date.now(),
    everReacheadUnpointify: false,
    everUnpointified: false,
    unpointifyPoints: x(0),
  };
}
function setNosaveValues() {
  nosave.lastLoop = Date.now();
  nosave.lastSave = Date.now();

  nosave.pmt = x(1); // time multiplier
  nosave.pfnr = x(0); // points for next rank
  nosave.puppm = x(1); // point Unpointify point multiplier
  nosave.pendingPuppm = x(1); // pending point Unpointify point multiplier

  nosave.isUnpointifyButtonVisible = false;
}

const rankNames = [
  "",
  "Super",
  "Mega",
  "Ultra",
  "Omega",
  "Extreme",
  "Insane",
  "Void",
  "Impossible",
  "Royal",
  "Divine",
  "Epic",
  "Legendary",
  "Mythical",
  "Unique",
  "Colossal",
  "Grand",
  "Exotic",
  "Ethereal",
  "Crazy",
  "Mysterious",
  "Cosmic",
  "Brilliant",
  "Astonishing",
  "Delightful",
  "Copacetic",
  "Spectacular",
  "Radiant",
  "Thunderous",
  "Majestic",
  "Titanic",
  "Magnificent",
  "Vibrant",
  "Fearless",
  "Supreme",
  "Glorious",
  "Phenomenal",
  "Epicurean",
  "Stellar",
  "Celestial",
  "Invincible",
  "Unstoppable",
  "Infinite",
  "Boundless",
  "Prismatic",
  "Illustrious",
  "Fabled",
  "Transcendent",
  "Galactic",
  "Heroic",
  "Illuminated",
  "Marvelous",
  "Splendid",
  "Awe-inspiring",
  "Resplendent",
  "Quantum",
  "Arcane",
  "Enigmatic",
  "Mystical",
  "Blazing",
  "Radiating",
  "Shimmering",
  "Luminous",
  "Vortex",
  "Nebular",
  "Astral",
  "Celestium",
  "Hyperion",
  "Infinity",
  "Omniversal",
  "Prime",
  "Supersonic",
  "Hyper",
  "Epicness",
  "Majestica",
  "Luminary",
  "Exemplar",
  "Apex",
  "Summit",
  "Zenith",
  "Pinnacle",
  "Paramount",
  "Ultimate",
  "Ascendant",
  "Transcendence",
  "Elysium",
  "Utopian",
  "Valiant",
  "Invictus",
  "Fortune",
  "Radiance",
  "Aurora",
  "Nebula",
  "Oblivion",
  "Paragon",
  "Celestia",
  "Equinox",
  "Vanguard",
  "Infinity-Prime",
  "Obsidian",
  "Luminescence",
  "Astralis",
  "Chronos",
  "Eclipse",
];

const COLOR_SEED = 50;

const main_functions = {
  formulas: {
    multiplier() {
      return nosave.pmt.multiply(nosave.puppm);
    },
    timeMultiplier(time) {
      return time > 3_600_000 ? x(3).pow(x(time).div(3_600_000).log(10)) : x(1);
    },
    rankRequirement(rank) {
      return x(10)
        .pow(x(rank + 1).min(5))
        .times(x(2).pow(x(rank - 4).max(0)))
        .softcap("1e6", 0.75, "pow")
        .softcap("5e6", 0.75, "pow");
    },
    unpointifyEffect(x) {
      return Decimal.pow(
        1.15,
        x
          .max(0)
          .plus(1)
          .log(Decimal.multiply(1e10, x.pow(0.01).max(1)))
      );
    },
  },
  updates: {
    // update HTML
    update(element, text) {
      if (element.html() !== text) element.html(text);
    },
    updateAll() {
      for (const upd in updates) {
        if (!["update", "updateAll"].includes(upd)) updates[upd]();
      }
    },
    updatePointRanks() {
      player.points.forEach((value, index) => {
        const text = $($("#points-container > *")[index]);
        const preword = index === 0 ? "" : rankNames?.[index] || index;

        this.update(text, `${preword} Points:<br /> ${abb_int(value)}`);
      });
    },
    time() {
      this.update(
        $("#time"),
        `${
          nosave.pmt.gt(1)
            ? `<span class="dark">${abb(nosave.pmt, 3)}x</span>`
            : ""
        }<br> ${msToTime(Date.now() - player.firstVisit)}`
      );
    },
    rank() {
      this.update(
        $("#rank"),
        `For next rank: <span class="size-150">${abb_int(nosave.pfnr)}</span>`
      );
    },
    nextFeature() {
      this.update(
        $("#next-feature"),
        player.everReacheadUnpointify
          ? ""
          : `For next feature: <span class="size-150">${abb(
              gameSettings.pointifyRequirement
            )}</span> points`
      );
    },
    unpointify() {
      const button = $("#unpointify");
      const condition = player.everReacheadUnpointify,
        isVisible = nosave.isUnpointifyButtonVisible;

      if (condition && !isVisible) {
        button.show();
        nosave.isUnpointifyButtonVisible = true;
      } else if (!condition && isVisible) {
        button.hide();
        nosave.isUnpointifyButtonVisible = false;
      }
    },
    unpointifyEffect() {
      const current = nosave.puppm,
        pending = nosave.pendingPuppm;
      const precision = 3;

      this.update(
        $("#unpointify-effect"),
        `Multiplier: ${abb(current, precision)}${
          pending.lte(current) ? "" : ` → ${abb(pending, precision)}`
        }`
      );
    },
  },
  gameFunctions: {
    addPointLayer(index, push = true) {
      if (push) player.points.push(x(0));
      const seed = `${index} ${COLOR_SEED}`;

      const set = (html) => {
        $("#points-container").append($(html));
      };

      const textColor1 = getRandomColorBySeed(seed);
      if (index < 6) {
        set(`<p class="points" style="color: ${textColor1}"></p>`);
        return;
      }

      const textColor2 = getRandomColorBySeed(seed, 2);
      if (index < 12) {
        set(
          `<p class="text-gradient" style="background-image: linear-gradient(${textColor1}, ${textColor2})"></p>`
        );
        return;
      }

      set(
        `<p class="text-gradient animated-gradient" style="background-image: repeating-linear-gradient(var(--angle), ${textColor1}, ${textColor2}, ${textColor1} var(--d))"></p>`
      );
    },
    addAllPointLayers() {
      player.points.forEach((_, i) => {
        this.addPointLayer(i, !player.points.length);
      });
      if (!player.points.length) gameFunctions.addPointLayer(0);
    },
    resetAllRanks() {
      player.points = [];
      $("#points-container *").remove();
      this.addAllPointLayers();
    },
    unpointify() {
      if (
        player.points[0].gte(gameSettings.pointifyRequirement) &&
        nosave.pendingPuppm.gt(nosave.puppm)
      ) {
        player.unpointifyPoints = player.points[0];
        player.everUnpointified = true;

        this.resetAllRanks();
      }
    },
  },
};

const formulas = main_functions.formulas;
const updates = main_functions.updates;
const gameFunctions = main_functions.gameFunctions;

function mainLoop() {
  const time = Date.now() - player.firstVisit;
  nosave.pmt = formulas.timeMultiplier(time);
  nosave.puppm = formulas.unpointifyEffect(player.unpointifyPoints);
  nosave.pfnr = formulas.rankRequirement(player.points.length - 1);

  player.points[0] = player.points[0].plus(
    x(1)
      .plus(player.points.length >= 2 ? player.points[1] : 0)
      .div(settings.fps)
      .times(formulas.multiplier())
  );

  if (player.points[0].gte(gameSettings.pointifyRequirement)) {
    player.everReacheadUnpointify = true;
  }

  nosave.pendingPuppm = formulas.unpointifyEffect(player.points[0]);

  for (let index = 0; index < player.points.length; index++) {
    const req = formulas.rankRequirement(index),
      pointContainer = player.points;
    const currentPoints = pointContainer[index];

    if (currentPoints.gte(req)) {
      player.points[index] = currentPoints.minus(req);
      if (index === player.points.length - 1) {
        gameFunctions.addPointLayer(index + 1);
      }
      player.points[index + 1] = player.points[index + 1].plus(
        x(1)
          .plus(
            index < player.points.length - 2 ? player.points?.[index + 2] : 0
          )
          .times(formulas.multiplier(player))
      );
    }
  }
  updates.updateAll();
  if (Date.now() >= nosave.lastSave + settings.auto_save * 1e3) {
    save();
  }
  nosave.lastLoop = Date.now();
}

$(window).on("load", () => {
  setNosaveValues();
  player = getDefaultPlayerValues();
  loadToPlayer();
  fixValues();

  $("#export").on("click", () => {
    const save = localStorage.getItem(settings.game_name),
      date = new Date(),
      post_name =
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString().replace(new RegExp(":", "g"), "-");
    downloadFile(save, settings.savefile_name + " " + post_name + ".txt");
  });

  $("#import").on("click", () => {
    const text = prompt(
      "Paste your text here. Your current save will be overwritten."
    );
    if (text) {
      player = getDefaultPlayerValues();
      loadToPlayer(text);
      save();
      location.reload();
    }
  });

  $("#unpointify").on("click", () => {
    gameFunctions.unpointify();
  });

  gameFunctions.addAllPointLayers();

  setInterval(mainLoop, getLoopInterval());
});
