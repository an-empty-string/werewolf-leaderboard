var lastId = undefined;
var refreshAt = undefined;

var sticky = false;
var highlighted = [];

var $ = function(x) { return document.getElementById(x); };

var $n = function(ty, cl, tx) {
    var el = document.createElement(ty);
    el.classList.add(cl);
    if(tx) {
        $text(el, tx);
    }
    return el;
};

var $text = function(el, text) {
    if(!(el instanceof HTMLElement)) {
        var el = $(el);
    }
    while(el.firstChild) { el.removeChild(el.firstChild); }
    el.appendChild(document.createTextNode(text));
};

var $par = function(el, cls) {
    while(el.classList) {
        if(el.classList.contains(cls)) { return el; }
        el = el.parentNode;
    }
};

var precise = function(n, p) {
    if(p < 1 || p > 21) return n;
    return n.toPrecision(p + 2);
};

var pl = function(n, s, p) {
    if(!p) p = s + "s";
    return n + " " + (n == 1 ? s : p);
};

var parseDate = function(d) {
    var day = 0, hr = 0, min = 0;
    var parsed = (typeof d == "string" ? Date.parse(d) : d)
    var sec = Math.floor(((new Date) - parsed) / 1000);

    var after = sec < 0;
    if(after) { sec = -sec; }

    while(sec >= 86400) { day++; sec -= 86400; }
    while(sec >= 3600)  { hr++; sec -= 3600; }
    while(sec >= 60)    { min++; sec -= 60; }

    var res = [];
    switch(true) {
        case day > 0:
            res.push(pl(day, "day"));
        case hr > 0:
            res.push(pl(hr, "hour"));
        case min > 0:
            res.push(pl(min, "minute"));
        default:
            res.push(pl(sec, "second"));
    }

    var s = res.join(", ");
    if(after) return "in " + s;
    return s + " ago";
};

var upDate = function(el, d) {
    var id = setInterval(function() {
        $text(el, parseDate(d));
    }, 1000);
    $text(el, parseDate(d));
    return id;
};

var getJSON = function(url, callback) {
    var req = new XMLHttpRequest();
    req.addEventListener("load", function() {
        callback(JSON.parse(req.responseText));
    });

    req.open("GET", url);
    req.send();
};

var createBoard = function(data) {
    var display = {"precision": data.display_precision, "suffix": data.display_suffix};

    var board = document.createElement("div");
    board.classList.add("board");

    var header = document.createElement("span");
    header.classList.add("header-text");
    $text(header, data.display_header.charAt(0).toUpperCase() + data.display_header.slice(1));
    board.appendChild(header);

    data.entries.forEach(function(entry) {
        board.appendChild(createEntry(display, entry));
    });

    return board;
};

var createEntry = function(display, entry) {
    var entryEl = $n("div", "entry");
    if(entry.tie) { entryEl.classList.add("tied"); }

    entryEl.appendChild($n("span", "place", entry.position));
    entryEl.appendChild($n("span", "player", entry.player));
    entryEl.setAttribute("data-player", entry.player);

    var valueEl = $n("span", "value");
    valueEl.appendChild($n("span", "valueText", precise(entry.value, display.precision)));
    valueEl.appendChild($n("span", "valueSuffix", display.suffix));
    entryEl.append(valueEl);

    return entryEl;
};

var statsUrl = function() {
    return document.body.getAttribute("data-source");
};

var clearBoards = function() {
    var boards = $("boards");
    while(boards.firstChild) { boards.removeChild(boards.firstChild); }
};

var updateDisplay = function() {
    getJSON(statsUrl(), function(data) {
        $text("channel", data.info.channel);
        if(lastId !== undefined) clearInterval(lastId);
        lastId = upDate($("generated"), data.info.generated);
        $text("min_games", data.info.min_games);
        $text("total_games", data.info.total_games);
        clearBoards();
        Object.keys(data.leaderboards).sort().forEach(function(leaderboardKey) {
            $("boards").appendChild(createBoard(data.leaderboards[leaderboardKey]));
        });
        refreshAt = Date.parse(new Date()) + (5 * 60 * 1000);
    });
};

var setRefreshDisplay = function() {
    setInterval(function() {
        if(refreshAt !== undefined && (new Date) > refreshAt) { updateDisplay(); }
    }, 1000);
};

document.addEventListener("DOMContentLoaded", function() {
    updateDisplay();
    setRefreshDisplay();
});

var highlight = function(target) {
    target.classList.add("hover");
    var els = document.querySelectorAll('.entry[data-player="' + target.getAttribute("data-player") + '"]');
    for(var i = 0; i < els.length; i++) {
        highlighted.push(els[i]);
        els[i].classList.add("hover");
    }
}

var unhighlight = function(target) {
    target.classList.remove("hover");
    highlighted.forEach(function(el) {
        el.classList.remove("hover");
    });
    highlighted = [];
}

document.addEventListener("mouseover", function(e) {
    var e = e || window.event;
    var target = $par(e.target || e.srcElement, "entry");
    if(!sticky && target) {
        highlight(target);
    }
});

document.addEventListener("mouseout", function(e) {
    var e = e || window.event;
    var target = $par(e.target || e.srcElement, "entry");
    if(!sticky && target) {
        unhighlight(target);
    }
});

document.addEventListener("click", function(e) {
    var e = e || window.event;
    var target = $par(e.target || e.srcElement, "entry");
    if(target) {
        if(sticky) {
            if(target.classList.contains("hover")) {
                unhighlight(target);
                sticky = false;
            }
        }
        else {
            highlight(target);
            sticky = true;
        }
    }
});
