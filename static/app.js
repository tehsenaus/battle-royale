;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        factory(define);
    } else {
        //Browser globals case.
        var name = 'coop',
            defined = {},
            node = typeof require === 'function';

        if ( node ) {
        } else {
        };

        factory(function (name, deps, factory) {
            var basePath = name.slice(0, name.lastIndexOf('/') + 1);

            for ( var i = 0; i < deps.length; i++ ) {
                var depPath = deps[i];

                if ( depPath[0] == '.' ) {
                    depPath = './' + basePath + depPath.slice(2);
                }
                
                var dep = defined[depPath];
                if (!dep) {
                    throw new Error(name + ": undefined module - " + depPath);
                }
                deps[i] = dep;
            }

            defined['./' + name] = factory.apply(this, deps);
        });

        var pkg = defined['./coop'];
        if ( node ) {
            module.exports = pkg;
        } else {
            root['coop'] = pkg;
        }
    }
}(this, function (define) {
    



define('lib/coop',[],function () {
	var coop = {};

	var Type = coop.Type = function Type () {
		
	};


	function makeArray(a) {
		return a instanceof Array ? a : [a];
	}

	function merge(a) {
		var lin = [];
		while(a.length) {
			
			var head = null;
			for(var i = 0; i < a.length; i++) {
				var h = a[i][0];
				if(!a.some(function(b) {
					return b.indexOf(h) > 0;
				}))
				{
					head = h;
					break;
				}
			}
			if(!head) {
				throw new Error("No linearization possible for " + a.join(','));
			}
			
			lin.push(head);
			
			a = a.map(function (b) {
				return b.filter(function (c) {
					return c !== head;
				});
			});
			a = a.filter(function (b) {
				return b.length;
			});
			
		}
		return lin;
	}



	// Top type
	function Top() {
		
	}
	Top.prototype.initialize = function () {
		
	};
	Top.__mro__ = [Top];
	Top.subclasses = [];
	Top.__dict__ = Top.prototype;
	Top.toString = function () {
		return "<object>"
	}


	// Returns the prototype
	coop.Class = function(name_or_bases_or_klass, bases_or_klass, klass) {
		var name = (typeof name_or_bases_or_klass == "string") && name_or_bases_or_klass;
		var bases = name
			? (klass ? makeArray(bases_or_klass) : [])
			: (bases_or_klass ? makeArray(name_or_bases_or_klass) : []);
		klass = klass || bases_or_klass || name_or_bases_or_klass;
		
		if(bases.length == 0) bases.push(Top);
		
		function Class() {
			if(this.initialize)
				this.initialize.apply(this, arguments);
		}
		
		Class.prototype = {};
		Class.__dict__ = {};
		Class.__name__ = name || "<class>";
		Class.prototype.constructor = Class;
		Class.subclasses = [];
		Class.toString = function () {
			return this.__name__;
		}
		
		var base_mros = bases.map(function(b) { return b.__mro__; });
		if(bases.length) base_mros.push(bases);
		
		Class.__mro__ = [Class].concat(merge(base_mros));
		var supercall = Class.prototype.supercall = function (klass, methodName, args) {
			return klass._super(this, methodName).apply(this, args || []);	
		}
		var _super = Class.prototype['super'] = Class.prototype._super = function () {
			var caller = _super.caller;
			var klass = caller.__class__;
			if(!klass)
				throw new Error("super must be called from within method.\nIn a callback, use this.supercall(Class, method[, args])");
			
			return supercall.call(this, klass, caller.__name__, arguments);
		}
		var super_co = Class.prototype.super_co = function(args, n) {
			// Caller hack
			var caller = super_co.caller;
			super_co.__class__ = caller.__class__;
			super_co.__name__ = caller.__name__;
			return this['super'].apply(this, Array.prototype.slice.call(args, n));
		}

		// Searches the MRO of the passed instance for the specified
		// property, starting from the superclass of this class.
		Class['super'] = Class._super = function (instance, propertyName) {
			var klass = Class;
			var mro = instance.constructor.__mro__;
			for(var i = mro.indexOf(klass) + 1; i < mro.length; i++) {
				var c = mro[i];
				if(propertyName in c.__dict__) {
					return c.__dict__[propertyName];
				}
			}
			throw new Error("Property " + propertyName + " has no definition in superclasses. MRO: " + mro);
		}

		Class.issuperclass = function (cls) {
			var mro = cls.__mro__;
			return mro && mro.indexOf(this) >= 0;
		}
		Class.isinstance = function (obj) {
			return Class.issuperclass(obj.constructor);
		}
		
		// Holds class property sources
		Class.__props__ = {};
		
		Class.implement = function(props, klass) {
			// Save class in functions for super() support
			if(!klass) for(var n in props) {
				var p = props[n];
				if(typeof p == 'function') {
					p.__class__ = Class;
					p.__name__ = n;
				}
				Class.__dict__[n] = p;
			};
			
			klass = klass || Class;
			for(var n in props) {
				var p = props[n];
				var pc = Class.__props__.hasOwnProperty(n) && Class.__props__[n];
				if(!pc || Class.__mro__.indexOf(klass) <= Class.__mro__.indexOf(pc)) {
					Class.prototype[n] = p;
					Class.__props__[n] = klass;
				}
			}
			Class.subclasses.forEach(function(s) {
				s.implement(props, klass);
			});
		}
		
		Class.implement(klass);
		
		bases.forEach(function(b) {
			b.subclasses.push(Class);
			for(var n in b.__props__) {
				var ps = {}
				ps[n] = b.prototype[n];
				Class.implement(ps, b.__props__[n]);
			}
		});
		
		Class.derived = function (name_or_properties, properties) {
			return new coop.Class(properties ? name_or_properties : Class,
				properties ? Class : name_or_properties, properties);
		};

		return Class;
	};

	coop.Top = Top;

	coop.Options = new coop.Class({
		initialize: function(options) {
			this.options = {};
			for(var i = this.constructor.__mro__.length - 1; i >= 0; i--) {
				var opts = this.constructor.__mro__[i].prototype.options;
				if(opts) for(var n in opts) {
					this.options[n] = opts[n];
				}
			}
			if(options) for(var n in options) {
				this.options[n] = options[n];
			}
			this._super.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	});



	coop.pop = function (args, n) {
		return Array.prototype.slice.call(args, n === undefined ? 1 : n);
	}
	coop.push = function (args) {
		return Array.prototype.concat.call(coop.pop(arguments), args);
	}

	return coop;
});

// This file is just added for convenience so this repository can be
// directly checked out into a project's deps folder



define('coop',['./lib/coop'], function (coop) {
	return coop;
});
	
}));

},{}],2:[function(require,module,exports){
var coop = require("./../../bower_components/coop/dist/coop.js"), P = require('./property');
var socket = io.connect();
var core = window.core = require('../common/core')(P);
var rules = window.rules = require('../common/rules')(P);
var Game = rules.RoyaleGame.derived({
        initialize: function (viewModel, data) {
            console.log('init client game');
            this.super(data);
            this.viewModel = viewModel;
            this.startD = jQuery.Deferred();
        },
        waitForStart: function () {
            return this.startD.promise();
        },
        stage: function (actor, stage, data) {
            var __this = this;
            var d = jQuery.Deferred();
            this.viewModel.player(actor);
            this.viewModel.stage({
                actor: actor,
                stage: stage,
                chooseActionD: d
            });
            if (actor.getAvailableActions(stage).length == 1) {
                d.resolve(actor.getAvailableActions(stage)[0]);
            }
            return d.promise().then(function (action) {
                return actor.perform(__this, action, data, stage);
            });
        },
        getActionSubject: function (action, actor) {
            var d = jQuery.Deferred();
            this.viewModel.stage({
                actor: actor,
                action: action,
                stage: 'choose player for ' + action,
                choices: this.players(),
                chooseD: d
            });
            return d.promise();
        }
    });
var Player = rules.RoyalePlayer.derived({
        chooseCards: function (game, choices) {
            var d = jQuery.Deferred();
            game.viewModel.stage({
                actor: this,
                stage: 'choose cards',
                choices: choices,
                chooseD: d
            });
            return d.promise();
        }
    });
var ViewModel = new coop.Class({
        initialize: function () {
            this.stage = ko.observable();
            this.game = new Game(this, { players: [] });
            this.player = ko.observable(new Player({
                cards: [],
                name: 'Player 1'
            }, this.game));
            this.game.addPlayer(this.player());
            this.game.addPlayer(new Player({
                cards: [],
                name: 'Player 2'
            }, this.game));
            this.game.host();
            this.game.startD.resolve();
        },
        getActions: function () {
            var stage = this.stage();
            return stage && stage.actor.getAvailableActions(stage.stage);
        },
        chooseAction: function (action) {
            this.stage().chooseActionD.resolve(action);
        }
    });
ko.applyBindings(window.viewModel = new ViewModel());
},{"../common/core":4,"../common/rules":5,"./../../bower_components/coop/dist/coop.js":1,"./property":3}],3:[function(require,module,exports){
var P = module.exports = ko.mapping.fromJS;
P.array = ko.mapping.fromJS;
P.get = function (v) {
    return v();
};
},{}],4:[function(require,module,exports){
function __iter(v, f) {
    v.forEach(f);
}
var __when = function (v, n) {
    return v && typeof v.then == 'function' ? v.then(n) : n(v);
};
var coop = require("./../../bower_components/coop/dist/coop.js");
var CARDS = 'A23456789TJQK', SUITS = 'DHSC', DECK = cprod(CARDS.split(''), SUITS.split('')).map(function (c) {
        return c.join('');
    });
module.exports = function (P) {
    var core = {};
    core.DECK = DECK;
    var Deck = core.Deck = new coop.Class('Deck', {
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
    core.Game = new coop.Class('Game', [Deck], {
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
    core.Player = Deck.derived('Player', {
        initialize: function (data, game) {
            this.super(data);
            this.game = game;
            this.name = data.name;
        },
        consume: function (game, patt, data) {
            return this.super(game, this, patt, data);
        },
        perform: function (game, action, data, stage) {
            console.log(this.toString(), 'perform', action.name, stage);
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
    core.Action = new coop.Class('Action', {
        isAvailable: function (game, actor, stage) {
            console.log(stage, this.stages);
            console.log(this.requires, this.stages);
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
            console.log(actor, 'perform', this.name, stage);
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
},{"./../../bower_components/coop/dist/coop.js":1}],5:[function(require,module,exports){
function __iter(v, f) {
    v.forEach(f);
}
var __when = function (v, n) {
    return v && typeof v.then == 'function' ? v.then(n) : n(v);
};
var coop = require("./../../bower_components/coop/dist/coop.js");
module.exports = function (P) {
    var core = require('./core')(P), rules = {};
    var Action = core.Action;
    var PlayerAction = core.PlayerAction;
    var AttackAction = PlayerAction.derived({
            stages: [
                'turn',
                'retaliate'
            ],
            perform: function (game, actor, data, stage) {
                var me = this, args = arguments;
                return function () {
                    return __when(this.supercall(AttackAction, 'perform', args), function (__t0) {
                        __t0;
                        var subject = data.playerActionSubject;
                        var damage = me.getDamage(game, actor, data);
                        console.log('attack: ' + me + ' ' + actor + ' -> ' + subject + ' for ' + damage + 'HP');
                        var defendData = {
                                attacker: actor,
                                attack: me,
                                damage: damage
                            };
                        return __when(game.stage(subject, 'defend ' + me.attackType, defendData), function (__t1) {
                            __t1;
                            return __when(!defendData.noRetaliation && subject.isAlive() && stage == 'turn' ? function () {
                                return __when(game.stage(subject, 'retaliate', {
                                    attacker: actor,
                                    playerActionSubject: actor,
                                    attack: me,
                                    damage: damage
                                }), function (__t2) {
                                    __t2;
                                });
                            }.call(this) : true, function (__t3) {
                                __t3;
                            });
                        });
                    });
                }.call(this);
            },
            getDamage: function () {
                return 1;
            }
        });
    var DefendAction = Action.derived({
            perform: function (game, actor, data) {
                var args = arguments;
                return function () {
                    var __this = this;
                    return __when(this.supercall(DefendAction, 'perform', args), function (__t0) {
                        __t0;
                        var damage = Math.max(data.damage - (__this.stopDamage || 0), 0);
                        actor.hp = P(P.get(actor.hp) - damage, {}, actor.hp);
                        data.noRetaliation = __this.noRetaliation;
                    });
                }.call(this);
            },
            getStopDamage: function (game, actor, data) {
                return this.stopDamage;
            }
        });
    var ShootAction = AttackAction.derived({ attackType: 'shot' });
    var RoyaleDeck = new coop.Class('RoyaleDeck', core.Deck, {
            wildcardType: 'W',
            cardTypes: {
                'A': 'W',
                '1': 'B',
                '2': 'B',
                '3': 'B',
                '4': 'B',
                '5': 'B',
                '6': 'R',
                '7': 'R',
                '8': 'R',
                '9': 'S',
                'T': 'V',
                'J': 'M',
                'Q': 'A',
                'K': 'G'
            },
            cardTypeNames: {
                'G': 'Gun',
                'B': 'Bullet',
                'R': 'RPS',
                'S': 'Sickle',
                'V': 'Bulletproof Vest',
                'M': 'Medikit',
                'A': 'Agility',
                'W': 'Wildcard'
            },
            prompts: {
                'T': 'Your Turn',
                'R': ''
            },
            actions: [
                ShootAction.derived({
                    name: 'Shoot',
                    uses: 'B',
                    requires: 'BG'
                }),
                ShootAction.derived({
                    name: 'Suzi',
                    uses: 'B+',
                    requires: 'B+GG',
                    getDamage: function (game, actor, data) {
                        return data.useCards.length;
                    }
                }),
                AttackAction.derived({
                    name: 'Sickle',
                    uses: 'S',
                    attackType: 'sickle'
                }),
                DefendAction.derived({
                    name: 'Take Damage',
                    stages: [
                        'defend shot',
                        'defend sickle'
                    ],
                    stopDamage: 0
                }),
                DefendAction.derived({
                    name: 'Heal',
                    uses: 'M+',
                    stages: ['defend shot'],
                    getStopDamage: function (game, actor, data) {
                        return data.useCards.length;
                    }
                }),
                DefendAction.derived({
                    name: 'Use Vest',
                    uses: 'V',
                    stages: ['defend shot'],
                    stopDamage: Infinity
                }),
                DefendAction.derived({
                    name: 'Sickle Block',
                    uses: 'S',
                    stages: ['defend sickle'],
                    stopDamage: 1
                }),
                DefendAction.derived({
                    name: 'Run Away',
                    uses: 'A',
                    stages: ['defend sickle'],
                    stopDamage: 1,
                    noRetaliation: true
                }),
                Action.derived({
                    name: 'No Retaliation',
                    stages: ['retaliate']
                }),
                Action.derived({
                    name: 'Discard',
                    uses: '.',
                    stages: [
                        'turn',
                        'retaliate'
                    ]
                }),
                Action.derived({
                    name: 'Hide',
                    stages: [
                        'turn',
                        'retaliate',
                        'can hide'
                    ],
                    perform: function (game, actor) {
                        return __when(this.super.apply(this, arguments), function () {
                            actor.hiding = P(true, {}, actor.hiding);
                        });
                    },
                    isAvailable: function (game, actor) {
                        return actor.getCards().length <= 2 && this.super.apply(this, arguments);
                    }
                }),
                Action.derived({
                    name: 'Don\'t Hide',
                    stages: ['can hide'],
                    isAvailable: function (game, actor) {
                        return actor.getCards().length > 0 && this.super.apply(this, arguments);
                    }
                })
            ].map(function (A) {
                return new A();
            })
        });
    rules.RoyaleGame = new coop.Class('RoyaleGame', [
        RoyaleDeck,
        core.Game
    ], {
        initialize: function (data) {
            console.log('init royale game', this.constructor.__mro__);
            data.returnedCards = data.returnedCards || core.DECK;
            this.super.apply(this, arguments);
        },
        deal: function () {
            this.super();
            __iter(P.get(this.players), function (p) {
                p.hiding = P(false, {}, P.hiding);
            });
        },
        hostRound: function (players) {
            var __this = this;
            return __when(this.super.apply(this, arguments), function () {
                if (players.every(function (p) {
                        return p.isHiding();
                    })) {
                    console.log('all players hiding - dealing');
                    return __this.deal();
                }
            });
        }
    });
    rules.RoyalePlayer = new coop.Class([
        core.Player,
        RoyaleDeck
    ], {
        initialize: function (data) {
            this.super.apply(this, arguments);
            this.hp = P(typeof data.hp === 'number' ? data.hp : 4);
            this.hiding = P(data.hiding);
        },
        isHiding: function () {
            return P.get(this.hiding);
        },
        isAlive: function () {
            return P.get(this.hp) > 0;
        },
        perform: function (game, action, data, stage) {
            var __this = this;
            console.log(this.toString(), 'perform', action.name, stage);
            return __when(this.super.apply(this, arguments), function () {
                if (!P.get(__this.hiding) && stage !== 'can hide') {
                    return game.stage(__this, 'can hide', {});
                }
            });
        },
        toString: function () {
            return this.super() + ' - ' + P.get(this.hp) + ' HP';
        }
    });
    return rules;
};
},{"./../../bower_components/coop/dist/coop.js":1,"./core":4}]},{},[2])
;