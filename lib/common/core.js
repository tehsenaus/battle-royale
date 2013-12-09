function __iter(v, f) {
    v.forEach(f);
}
var __when = function (v, n) {
    return v && typeof v.then == 'function' ? v.then(n) : n(v);
};
var coop = require('coop');
var CARDS = 'A23456789TJQK', SUITS = 'DHSC', DECK = cprod(CARDS.split(''), SUITS.split('')).map(function (c) {
        return c.join('');
    });
module.exports = function (P) {
    var core = {};
    core.DECK = DECK;
    var Deck = core.Deck = new coop.Class({
            initialize: function (data) {
                this.cards = P.array(data.cards);
            },
            getCards: function () {
                return P.get(this.cards);
            },
            getInventory: function () {
                var __this = this;
                var cards = this.getCards();
                if (this.cardTypes) {
                    return cards.map(function (c) {
                        return {
                            card: c,
                            type: __this.cardTypes[c[0]]
                        };
                    });
                } else {
                    return cards.map(function (c) {
                        return {
                            card: c,
                            type: c
                        };
                    });
                }
            },
            getInventorySets: function () {
                return getSets(sortByKey(this.getInventory(), function (i) {
                    return i.type;
                })).map(function (a) {
                    return [
                        a.map(function (i) {
                            return i.card;
                        }),
                        a.map(function (i) {
                            return i.type;
                        }).join('')
                    ];
                });
            },
            getMatchingInventory: function (patt) {
                var r = new RegExp('^' + patt + '$');
                return this.getInventorySets().filter(function (s) {
                    return !!r.exec(s[1]);
                });
            },
            getMatchingCardSets: function (patt) {
                return this.getMatchingInventory(patt).map(function (i) {
                    return i[0];
                });
            },
            hasInventory: function (patt) {
                return !!this.getMatchingInventory(patt).length;
            },
            consume: function (game, actor, patt, data) {
                var me = this;
                return function () {
                    return __when(!data.useCards ? function () {
                        return __when(actor.chooseCards(game, me.getMatchingCardSets(patt), data), function (__t0) {
                            data.useCards = __t0;
                        });
                    }.call(this) : true, function (__t1) {
                        __t1;
                        __iter(data.useCards, function (c) {
                            me.cards.remove(c);
                            if (!data.noCardReturn) {
                                me.returnCard(c);
                            }
                        });
                    });
                }.call(this);
            }
        });
    core.Game = new coop.Class([Deck], {
        initialize: function (data) {
            console.log('init game');
            this.super(data);
            this.players = P.array(data.players);
            this.returnedCards = P.array(data.returnedCards || []);
        },
        deal: function () {
            var cards = P.get(this.returnedCards), players = P.get(this.players).filter(function (p) {
                    return p.isAlive();
                });
            cards = shuffle(cards);
            cards.forEach(function (c, i) {
                players[i % players.length].cards.push(c);
            });
            this.returnedCards = P([], {}, this.returnedCards);
        },
        returnCard: function (c) {
            this.returnedCards.push(c);
        },
        addPlayer: function (player) {
            this.players.push(player);
        },
        host: function () {
            var me = this;
            return function () {
                return __when(me.waitForStart(), function (__t0) {
                    __t0;
                    var players = P.get(me.players);
                    if (players.length == 0) {
                        throw new Error('No players!');
                    }
                    return __when(me.hostRound(players), function (__t1) {
                        __t1;
                        return me.host();
                    });
                });
            }.call(this);
        },
        hostRound: function (players) {
            var me = this;
            return function () {
                var __t0;
                __iter(players, function (p) {
                    __t0 = __when(__t0, function () {
                        return function () {
                            return __when(me.stage(p, 'turn', {}), function (__t1) {
                                __t1;
                            });
                        }.call(this);
                    });
                });
                return __when(__t0, function (__t2) {
                    __t2;
                });
            }.call(this);
        },
        getAvailableActions: function (actor, stage) {
            var __this = this;
            return this.actions.filter(function (a) {
                return a.isAvailable(__this, actor, stage);
            });
        }
    });
    core.Player = Deck.derived({
        initialize: function (data, game) {
            this.super(data);
            this.game = game;
            this.name = data.name;
        },
        consume: function (game, patt, data) {
            return this.super(game, this, patt, data);
        },
        perform: function (game, action, data, stage) {
            return action.perform(game, this, data, stage);
        },
        returnCard: function (c) {
            this.game.returnCard(c);
        },
        getAvailableActions: function (stage) {
            return this.game.getAvailableActions(this, stage);
        },
        toString: function () {
            return this.name;
        }
    });
    core.Action = new coop.Class({
        isAvailable: function (game, actor, stage) {
            if (this.stages.indexOf(stage) < 0) {
                return false;
            }
            var requires = this.requires || this.uses;
            if (requires) {
                if (!actor.hasInventory(requires)) {
                    return false;
                }
            }
            return true;
        },
        perform: function (game, actor, data, stage) {
            return function () {
                if (!this.isAvailable(game, actor, stage)) {
                    throw new Error('Action not available!');
                }
                return __when(this.uses ? function () {
                    return __when(actor.consume(game, this.uses, data), function (__t0) {
                        __t0;
                    });
                }.call(this) : true, function (__t1) {
                    __t1;
                });
            }.call(this);
        },
        toString: function () {
            return this.name;
        }
    });
    core.PlayerAction = core.Action.derived({
        perform: function (game, actor, data) {
            return this.super.apply(this, arguments).then(function () {
                return function () {
                    return __when(!data.playerActionSubject ? function () {
                        return __when(game.getActionSubject(this, actor), function (__t0) {
                            data.playerActionSubject = __t0;
                        });
                    }.call(this) : true, function (__t1) {
                        __t1;
                    });
                }.call(this);
            });
        }
    });
    return core;
};
function sortByKey(array, fn) {
    return array.sort(function (a, b) {
        var x = fn(a);
        var y = fn(b);
        return x < y ? -1 : x > y ? 1 : 0;
    });
}
function getSets(arr) {
    var res = [[]];
    for (var i = 0; i < arr.length; i++) {
        for (var j = i + 1; j <= arr.length; j++) {
            res.push(arr.slice(i, j));
        }
    }
    return res;
}
function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}
function cprod() {
    return Array.prototype.reduce.call(arguments, function (a, b) {
        var ret = [];
        a.forEach(function (a) {
            b.forEach(function (b) {
                ret.push(a.concat([b]));
            });
        });
        return ret;
    }, [[]]);
}