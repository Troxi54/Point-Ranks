const x = n=>new Decimal(n);
function floor(num, acc) { return Math.floor(num * 10 ** acc) / 10 ** acc; }

function abb(num, acc = 2, absolute = false) {
    num = x(num);
    if (absolute && num.lt(x('0e0'))) num = x('0e0');
    const abbs = ['', 'k', 'M', 'B', 'T', 'Qd', 'Qn', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nd', 
      'Vg', 'Uvg', 'Dvg', 'Tvg', 'Qavg', 'Qivg', 'Sxvg', 'Spvg', 'Ocvg', 'Nvg', 'Tg'];
    if (num.eq("0")) {
        return "0";
    } else if (num.lt("1e3")) {
        return num.toNumber().toFixed(acc);
    } else if (num.lt("1e6")) {
        return num.toNumber().toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (num.lt(x(1e3).pow(abbs.length))) {
        const log = num.log(1e3).abs().floor();
        const numm = num.div(Decimal.pow(1e3, log));
        return numm.toFixed(3 - +numm.log(10).floor()) + abbs[log.toNumber()];
    } else if (num.lt("ee6")) {
        let exp = num.log10();
            exp = exp.plus(exp.div(1e9)).floor();
        return num.div(x(10).pow(exp)).toNumber().toFixed(2) + "e" + abb(exp, 0);
    } else if (num.lt("eeee10")) {
        return "e" + abb(num.log10(), acc);
    } else {
        return "F" + abb(num.slog(10), acc);
    }
}

function abb_int(num) { return abb(num, 0); }

function abb_abs(num) { return abb(num, undefined, true); }

function abb_abs_int(num) { return abb(num, 0, true); }

// taken and edited from: https://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
function romanize (num) {
    if (num instanceof Decimal)
        num = num.toNumber();
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

function save()
{
    if (settings.save)
    {
        if (player != getDefaultPlayerValues())
        {
            let Player = {};
            for (const prop in player) Player[prop] = player[prop]
            for (let prop in Player)
            {
                if (Player[prop] instanceof Decimal)
                {
                    Player[prop] = Player[prop].toString();
                }
            }
            localStorage.setItem(settings.game_name, btoa(JSON.stringify(Player)));
            console.log('Succesfully saved');
        }
    }
}
function load(data = localStorage.getItem(settings.game_name))
{
    let isValid = false;
    try { JSON.parse(data); isValid = true } catch { isValid = false; }
    if ( isValid )
    {
        save();
        data = btoa(data);
    }
    if (data)
    {
        data = JSON.parse(atob(data));
        for (let p in data)
        {
            if (data.hasOwnProperty(p))
            {
                if (typeof data[p] === 'string')
                {
                    if (data[p].includes('e') || /\d/.test(data[p]))
                    {
                        const value = x(data[p]).toNumber();
                        if (value != NaN && value != undefined)
                        {
                            data[p] = x(data[p]);
                        } 
                        else 
                        {
                            console.warn(`Load value failed: value is ${value} for ${p}`);
                        }
                    }
                }
                if (p === "points")
                {
                    for (let pt in data.points)
                    {
                        data.points[pt] = x(data.points[pt]);
                    }
                }
            }
        }
    }
    return data;
}

function loadToPlayer(data_)
{
    let data = load(data_);
    if (data)
    {
        for (let property in data)
        {
            player[property] = data[property];
        }
    }
}

function fixValues()
{
    for (let property in player)
    {
        if (player[property] instanceof Decimal)
        {
            if (player[property].isNan())
            {
                player[property] = x(0)
            }
            else if (player[property].lt(0)) {
                
                player[property] = x(0);
            }
        }
    }
    for (let cont in player.upgrades) {
        player.upgrades[cont].forEach(function(upg){
            if (upg.bought_times.gt(upg.buyable_times)) upg.bought_times = upg.buyable_times;
        })
    }
}

function getLoopInterval() {
    return 1e3 / settings.fps;
}

function numToTime(num)
{
    if (num instanceof Decimal === false) { num = x(num); }
    const array = ['d', 'h', 'm', 's', 'ms', 'μs', 'ns'],
          second = array.indexOf('s');
    let index = second;
    if (num.gte(1)) {
        let divider = 1;
        if (num.gte(60)) { 
            index--; 
            divider = 60;
        }
        if (num.gte(3600)) {
            index--; 
            divider = 3600;
        }
        if (num.gte(86400)) {
             index--; 
             divider = 86400;
        }
        num = num.div(divider);
    }
    else if (num.lt(1)) {
        let log = num.log(1e3).abs().floor().plus(1);
        //if (JSON.parse(log) === JSON.parse(log.ceil())) log = log;
        index = second + +log;
        if (index >= array.length) index = array.length - 1;
        num = num.times(Decimal.pow(1e3, log.min(array.length - second)));
        if (num.eq(1e3)) {
            num = num.div(1e3); 
            index--;
        }
    }
    return abb_abs(num) + array[index];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
 
// taken from: https://www.delftstack.com/howto/javascript/javascript-random-seed-to-generate-random/
// {
function MurmurHash3(string) {
    let i = 0;
    for (i, hash = 1779033703 ^ string.length; i < string.length; i++) {
      let bitwise_xor_from_character = hash ^ string.charCodeAt(i);
      hash = Math.imul(bitwise_xor_from_character, 3432918353);
      hash = hash << 13 | hash >>> 19;
    }
    return () => {
      // Return the hash that you can use as a seed
      hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
      hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
      return (hash ^= hash >>> 16) >>> 0;
    }
  }
  
  function SimpleFastCounter32(seed_1, seed_2, seed_3, seed_4) {
    return () => {
      seed_1 >>>= 0;
      seed_2 >>>= 0;
      seed_3 >>>= 0;
      seed_4 >>>= 0;
      let cast32 = (seed_1 + seed_2) | 0;
      seed_1 = seed_2 ^ seed_2 >>> 9;
      seed_2 = seed_3 + (seed_3 << 3) | 0;
      seed_3 = (seed_3 << 21 | seed_3 >>> 11);
      seed_4 = seed_4 + 1 | 0;
      cast32 = cast32 + seed_4 | 0;
      seed_3 = seed_3 + cast32 | 0;
      return (cast32 >>> 0) / 4294967296;
    }
  }
  // }

function Round(num, acc = 4)
{
return num.plus(num.div(Decimal.pow(10, acc).round())).floor();
}

function isCharNumber(c) {
return typeof c === 'string' && c.length === 1 && c >= '0' && c <= '9';
}

// not mine
Decimal.prototype.softcap = function(start, power, mode, dis=false) {
    var x = this;
    if (!dis&&x.gte(start)) {
        if ([0, "pow"].includes(mode)) x = x.div(start).max(1).pow(power).mul(start)
        if ([1, "mul"].includes(mode)) x = x.sub(start).div(power).add(start)
        if ([2, "exp"].includes(mode)) x = expPow(x.div(start), power).mul(start)
        if ([3, "log"].includes(mode)) x = x.div(start).log(power).add(1).mul(start)
    }
    return x
}

// not mine
Decimal.prototype.overflow = function(start, power, meta=1){
    let number = this
    if(isNaN(number.mag))return new Decimal(0);
    start=Decimal.iteratedexp(10,meta-1,1.0001).max(start);
    if(number.gte(start)){
        let s = start.iteratedlog(10,meta)
        number=Decimal.iteratedexp(10,meta,number.iteratedlog(10,meta).div(s).pow(power).mul(s));
    }
    return number;
}

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return (hrs ? (hrs + 'h. ') : '')
          + (hrs || mins ? (mins + 'm. ') : '')
          + secs + 's. ';
}