function __iter(v, f) {
    v.forEach(f);
}
var __when = function (v, n) {
    return v && typeof v.then == 'function' ? v.then(n) : n(v);
};
var coop = require('coop');
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