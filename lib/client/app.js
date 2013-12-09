var coop = require('coop'), P = require('./property');
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