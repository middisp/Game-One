/* TODO */
//B. #Weapon Range - This will need to be added in once we move to a 'board'. Each weapon will have a range.
//C. #Should speed play a part in combat?
//    I.E fastest strikes first and bypasses blocks.
//D. #Need a way to 'clear' the game board w/o refresh.
//E. #I need a DMG algorithm, (baseDmg + Strength + weaponDmg) - (Armor + Buffs + abilities + items)
//   #DMG = ((strength/2) + weaponDmg) - (armorVal + (toughness/2) + buffs + abilities + items);
//F. #Add local storage support, so users can 'save' a character.
//G. #Need to work out the pros/cons of each class.
//    Tied to stats and items they can use.
//    Need to add an aglorithm to work out stats-to-lvl.
//H. #Need to implement pros/cons.
//I. #Need to implement class icons.
//J. #Home screen?
//K. #Leveling system. Exp, skills tree, that sort of shit.
//L. #Add getCurrentWeight function to return the total weight of all items.
//M. #Add UI element to show collectables.
//    Need to decide a max item number.
//N. #Redo UI stuff, coz its piss poor.
//    Take out the dymamicness in it. Template?
//O. #Status:
//    Poison =  {'color':'green', 'effect': 'health'};
//    Gas = {'color':'yellow', 'effect': 'stamina'};
//    Tangle = {'color':'purple', 'effect': 'speed'};
//    Weaken = {'color':'orange', 'effect': 'strength'}; //does not effect carry limit.
//P. #Items - Need a facility to allow picking up and dropping items.
//Q. #Equipment - Need a facility to allow equiping and unequiping items, ensure stats are updated.
//R. #Items - Need to create some test item objects.
/* /TODO */

var currentTurn = [];
var turnCount = 0;
var players = [];

function observer(changes) {
    // Use this to update the UI
    changes.forEach(function (change, i) {
        UI.update(change);
    });
}

// Use this to output message to the window.
function log(msg) {
    // It will take one arg, a message string.
    document.querySelector('#log').textContent += Array.prototype.join.call(arguments, '') + '\n';
}

var Character = function (name, _class) {
    this.level = 0;
    this.name = name;
    this.action = null;
    this.armorValue = {
        physical: 0,
        magical: 0
    };
    this.exp = 0;
    
    // Get class here 
    setClass[_class](this);

    this.activeStatus = [];

    this.weightLimit = this.strength * 10;
    this.max_health = this.health;
    this.max_mana = this.mana;
    this.max_stamina = this.stamina;

    // Collectables and pick ups, stored as an array of objects.
    this.items = [];
    this.armor = [];
    this.potions = [];
    this.currentCarryWeight = this.getCurrentCarryWeight();

    // Attack damage and resistances
    this.weaponDmg = this.equipped.weapon.dmg;
    this.dmg = (this.strength / 2) + this.weaponDmg;

    this.madeMove = false;
    this.klass = _class;
    this.coOrds = {x:0, y:0};

    this.setAV();

    players.push(this);
    UI.build(this);
};

Character.prototype.move = function (move, opponent) {
    //Check player isn't moving again in the current turn   
    if (this.madeMove) {
        return false;
    }
    this.madeMove = true;
    currentTurn.push({
        '_this': this,
            'move': move,
            'opponent': opponent
    });

    // Update player status
    this.action = move;

    for (i = 0; i < players.length; i++) {
        if (!players[i].madeMove) {
            return false;
        }
    }

    var len = currentTurn.length;
    for (var i = 0; i < len; i++) {

        var _this = currentTurn[i]._this,
            _move = currentTurn[i].move,
            _opponent = currentTurn[i].opponent;

        // Check stamina/mana here
        if (!_this.move[_move].apply(_this, [_opponent])) {
            // What to return if no move made?
            log(_this.name + ' cannot make this move.');
        }
    }
    // Start a new turn
    for (i = 0; i < players.length; i++) {
        players[i].madeMove = false;
        players[i].checkBuffs();
    }

    currentTurn = [];
    turnCount++;
};

// DEATH
Character.prototype.isDead = function () {
    log(this.name + ' is DEAD!');
    UI.disableUI(this);
};

// Used to add and remove the effects of buffs/debuffs.
Character.prototype.checkBuffs = function () {
    var status = this.activeStatus;
    var statusLen = status.length;

    for (var i = 0; i < statusLen; i++) {
        if (status[i].ends > turnCount) {
            // Check for 'debuffs' and add damge.
            if (!status[i].applied) {
                if(status[i].onceOnly){
                    status[i].applied = true;
                }
                if (status[i].type === 'debuff') {
                    var dmg = status[i].damage;
                    console.log(dmg);
                    this.decreaseStat(status[i].stat, dmg);
                    UI.addDebuff(this, status[i].name);
                } else {
                    this.increaseStat(status[i].stat);
                    UI.addBuff(this, status[i].name);
                }
            }
        } else {
            // Remove expired 'debuffs'.
            UI.removeDebuff(this, status[i].name);
            this.activeStatus.splice(i, 1);
        }
    }
};

// Stat changes
Character.prototype.increaseStat = function (stat) {
    // Generic function to increase player statistics.
    var statLimit = this['max_' + stat];
    this[stat] += 1;
    if (this[stat] > statLimit) {
        this[stat] = statLimit;
    }
    return true;
};

Character.prototype.decreaseStat = function (stat, dmg) {
    // Generic function to decrease player statistics.

    this[stat] -= dmg || 1;
    if (this[stat] <= 0) {
        this[stat] = 0;
        // Need to check if stat === 'health' so we can handle death.
        if (stat === 'health') {
            // call death
            this.isDead();
        }
        return false;
    } else {
        return true;
    }
};

// Active Moves
Character.prototype.move.attack = function (target) {
    if (this.decreaseStat('stamina')) {
        log(this.name + ' attacked ' + target.name);
        console.log('target: ' + target.action);
        if (target.action !== 'block' && target.action !== 'dodge') {
            dmg = this.workOutDamage(target, 'physical');
            target.decreaseStat('health', dmg);
        }
        return true;
    } else {
        return false;
    }
};

// Magic Moves
Character.prototype.move.magic = function (target) {
    if (this.decreaseStat('mana')) {
        log(this.name + ' threw a fireball');
        if (target.status !== 'shield') {
            dmg = this.workOutDamage(target, 'magical');
            target.decreaseStat('health', dmg);
        }
        return true;
    } else {
        return false;
    }
};

// Debuffs
Character.prototype.move.poison = function (target) {
    if (this.decreaseStat('mana')) {
        var status = {
            type: 'debuff',
            name: 'poison',
            stat: 'health',
            effect: 'decrease',
            ends: (turnCount + 3),
            damage: Math.floor(this.magicDmg / 2)
        };
        target.activeStatus.push(status);
        log(this.name + ' used poison. ' + target.name + ' is poisoned for 3 turns.');
        return true;
    } else {
        return false;
    }
};

Character.prototype.move.gas = function (target) {
    if (this.decreaseStat('mana')) {
        var status = {
            type: 'debuff',
            name: 'gas',
            stat: 'stamina',
            effect: 'decrease',
            ends: (turnCount + 3),
            onceOnly: true,
            applied: false
        };
        target.activeStatus.push(status);
        log(this.name + ' used gas. ' + target.name + ' is gassed for 3 turns.');
        return true;
    } else {
        return false;
    }
};

Character.prototype.move.tangle = function (target) {
    if (this.decreaseStat('mana')) {
        var status = {
            type: 'debuff',
            name: 'tangle',
            stat: 'speed',
            effect: 'decrease',
            ends: (turnCount + 3),
            onceOnly: true,
            applied: false
        };
        target.activeStatus.push(status);
        log(this.name + ' used tangle. ' + target.name + ' is tangled for 3 turns.');
        return true;
    } else {
        return false;
    }
};

Character.prototype.move.weaken = function (target) {
    if (this.decreaseStat('mana')) {
        var status = {
            type: 'debuff',
            name: 'weaken',
            stat: 'strength',
            effect: 'decrease',
            ends: (turnCount + 3),
            onceOnly: true,
            applied: false
        };
        target.activeStatus.push(status);
        target.decreaseStat(status.stat);
        log(this.name + ' used weaken. ' + target.name + ' is weakened for 3 turns.');
        return true;
    } else {
        return false;
    }
};

// Passive Moves
Character.prototype.move.heal = function (target) {
    if (this.decreaseStat('mana')) {
        target.increaseStat('health');
        log(this.name + ' used heal. ' + target.name + "'s health is now " + target.health);
        return true;
    } else {
        return false;
    }

};

Character.prototype.move.block = function () {
    // Blocks physical attacks
    log(this.name + ' blocked the blow!');
    this.increaseStat('stamina');
    return true;
};

Character.prototype.move.dodge = function () {
    log(this.name + ' dodged the blow!');
    this.decreaseStat('stamina');
    return true;
};

Character.prototype.move.shield = function (target) {
    // Protect against magic
    if (this.decreaseStat('mana')) {
        log(target.name + ' used dispell!');
        return true;
    } else {
        return false;
    }
};

// Getters
Character.prototype.getMoves = function () {
    var validMoves = [];
    for (var i = 0; i < this.movesList.length; i++) {
        validMoves.push(this.movesList[i]);
    }
    return validMoves;
};

Character.prototype.getClass = function () {
    return this._class;
};

Character.prototype.getCurrentEquipped = function (type) {
    // String Type = optional, use it to get items, potions. Default is 'all'.
};

Character.prototype.getCurrentCarryWeight = function(){
    // Loop through ALL items and get its weight, return this number
    // If carryWeight < weightLimit, Character cannot pick up any new items.
    console.info(typeof this.equipped);
    for (var key in this.equipped) {
        console.log(this.equipped[key]);
    }
    return 10;
};

// Armor Values and Damage
Character.prototype.getAV = function () {
    return this.armorValue;
};

Character.prototype.setAV = function () {
    if (this.equipped.armor) {

        var armor = this.equipped.armor,
            resistance = 0,
            currentArmor = this.armorValue.physical,
            currentResistance = this.armorValue.magical,
            phead = 0, ptorso = 0, plegs = 0, pfeet = 0,
            mhead = 0, mtorso = 0, mlegs = 0, mfeet = 0;

        if (armor.head) {
            phead = armor.head.protection || 0;
            mhead = armor.head.resistance || 0;
        }

        if (armor.torso) {
            ptorso = armor.torso.protection || 0;
            mtorso = armor.torso.resistance || 0;
        }

        if (armor.legs) {
            plegs = armor.legs.protection || 0;
            mlegs = armor.legs.resistance || 0;
        }

        if (armor.feet) {
            pfeet = armor.feet.protection || 0;
            mfeet = armor.feet.resistance || 0;
        }

        this.armorValue.physical = currentArmor + phead + ptorso + plegs + pfeet;
        this.armorValue.magical = currentResistance + mhead + mtorso + mlegs + mfeet;
    }
};

Character.prototype.workOutDamage = function (target, type) {
    var actual, av = target.getAV();
    if (type === 'physical') {
        actual = this.dmg - (av.physical + (av.magical / 2));
    } else if (type === 'magical') {
        actual = this.magicDmg - av.magical;
    }
    if (actual < 1) {
        actual = 1;
    }

    return actual;
};

//Classes
var setClass = {
    warrior: function (player) {
        var level = player.level;
        player.health = 15 + level;
        player.stamina = 6 + level;
        player.strength = 6 + level;
        player.toughness = 5 + level;
        player.mana = 0;
        player.speed = 6 + level;
        player.armorValue.physical = 5;
        player.movesList = ['attack', 'block'];
        player.movement = 1;
        player.equipped = {
            weapon: {
                dmg: 2,
                type: 'sword',
                weight: 2
            }
        };
        player.magicDmg = 0;
    },

    wizard: function (player) {
        var level = player.level;
        player.health = 10 + level;
        player.stamina = 5 + level;
        player.strength = 5 + level;
        player.toughness = 1 + Math.floor(level / 2);
        player.mana = 15 + level;
        player.speed = 5 + level;
        player.armorValue.magical = 5;
        player.movesList = ['magic', 'shield', 'heal', 'poison', 'weaken', 'tangle', 'block'];
        player.movement = 1;
        player.equipped = {
            weapon: {
                dmg: 2,
                type: 'staff',
                weight: 2
            }
        };
        player.magicDmg = 5 + level;
    },

    scout: function (player) {
        var level = player.level;
        player.health = 10 + level;
        player.stamina = 15 + level;
        player.strength = 5 + level;
        player.toughness = 1 + level;
        player.mana = 10 + level;
        player.speed = 15 + level;
        player.movesList = ['attack', 'block', 'dodge'];
        player.movement = 2;
        player.equipped = {
            weapon: {
                dmg: 2,
                type: 'knife',
                weight: 1
            },
            armor: {
                torso: {
                    weight: 1,
                    protection: 2
                }
            }
        };
        player.magicDmg = 0;
    },

    paladin: function (player) {
        var level = player.level;
        player.health = 10 + level;
        player.stamina = 10 + level;
        player.strength = 6 + level;
        player.toughness = 2 + level;
        player.mana = 5 + level;
        player.speed = 2 + level;
        player.armorValue.magical = 1;
        player.movesList = ['attack', 'heal', 'block'];
        player.movement = 1;
        player.equipped = {
            weapon: {
                dmg: 2,
                type: 'sword',
                weight: 2
            },
            armor: {
                head: {
                    weight: 1,
                    protection: 1
                },
                torso: {
                    weight: 2,
                    protection: 1,
                    resistance: 1
                },
                legs: {
                    weight: 1,
                    protection: 1
                },
                feet: {
                    weight: 1,
                    protection: 1
                }
            }
        };
        player.magicDmg = 1 + Math.floor(level / 2);
    }
};

/********************\
 ***** UI STUFF *****
\********************/
var UI = {
    moveList: null,

    update: function (change) {
        var name = change.object.name;
        var playerUI = '.' + name;
        var ui = document.querySelector(playerUI);
        var healthBar = document.querySelector(playerUI + ' .healthBar');
        var staminaBar = document.querySelector(playerUI + ' .staminaBar');
        var manaBar = document.querySelector(playerUI + ' .manaBar');
        healthBar.innerHTML = change.object.health;
        staminaBar.innerHTML = change.object.stamina;
        manaBar.innerHTML = change.object.mana;
    },

    build: function (player) {
        var moves = player.getMoves();
        var av = player.getAV();

        var wrapper = document.querySelector('.gameFrame');
        var nameWrapper = document.createElement('dl');
        var nameLabel = document.createElement('dt');
        var name = document.createElement('dd');
        var klassLabel = document.createElement('dt');
        var klass = document.createElement('dd');
        var stats = document.createElement('dl');
        var healthLabel = document.createElement('dt');
        var staminaLabel = document.createElement('dt');
        var manaLabel = document.createElement('dt');
        var healthBar = document.createElement('dd');
        var staminaBar = document.createElement('dd');
        var manaBar = document.createElement('dd');
        var movesLabel = document.createElement('dt');
        var movesWrapper = document.createElement('dd');
        var movesList = document.createElement('select');
        var makeMove = document.createElement('a');
        var opponentsWrapper = document.createElement('div');

        var moveListOptions = '';

        for (var i = 0; i < moves.length; i++) {
            moveListOptions += '<option value="' + moves[i] + '">' + moves[i] + '</option>';
        }

        // Need to update this to be a bar - eventually
        healthBar.classList.add('healthBar');
        staminaBar.classList.add('staminaBar');
        manaBar.classList.add('manaBar');

        name.innerHTML = player.name;
        klass.innerHTML = player.klass;
        healthBar.innerHTML = player.health;
        staminaBar.innerHTML = player.stamina;
        manaBar.innerHTML = player.mana;

        nameWrapper.classList.add('name-wrapper');
        nameLabel.classList.add('nameLabel');
        healthLabel.classList.add('healthLabel');
        staminaLabel.classList.add('staminaLabel');
        manaLabel.classList.add('manaLabel');

        nameLabel.innerText = 'Player';
        klassLabel.innerText = 'Class';
        healthLabel.innerText = 'Health';
        staminaLabel.innerText = 'Stamina';
        manaLabel.innerText = 'Mana';
        movesLabel.innerText = 'Moves';

        makeMove.classList.add('btn');
        makeMove.classList.add('js-makeMove');
        makeMove.innerText = 'Make move';
        makeMove.setAttribute('data-player', player.name);
        movesList.classList.add('js-movesList');
        movesList.innerHTML = moveListOptions;

        opponentsWrapper.classList.add(player.name + '-opponents');
        opponentsWrapper.classList.add('js-opponents');

        nameWrapper.appendChild(nameLabel);
        nameWrapper.appendChild(name);
        nameWrapper.appendChild(klassLabel);
        nameWrapper.appendChild(klass);

        stats.classList.add(player.name);
        stats.appendChild(healthLabel);
        stats.appendChild(healthBar);
        stats.appendChild(manaLabel);
        stats.appendChild(manaBar);
        stats.appendChild(staminaLabel);
        stats.appendChild(staminaBar);
        movesWrapper.appendChild(movesList);
        stats.appendChild(movesLabel);
        stats.appendChild(movesWrapper);

        wrapper.appendChild(nameWrapper);
        wrapper.appendChild(stats);
        wrapper.appendChild(makeMove);
        wrapper.appendChild(opponentsWrapper);

        makeMove.addEventListener('click', delegateMove);
        // Update the opponents for all players.
        UI.updateOpponents(player);

        // Should I 'null' out all the vars above to help with GC?
    },

    updateOpponents: function (player) {
        // Get all players and create a radio button group.
        var opponentsWrapper = document.querySelectorAll('.js-opponents');

        for (var i = 0; i < opponentsWrapper.length; i++) {
            var output = '';
            for (var j = 0; j < players.length; j++) {
                output += '<input name="' + players[i].name + i + '" type="radio" value="' + players[j].name + '">' + players[j].name + '</input>';
            }
            opponentsWrapper[i].innerHTML = output;
        }
    },

    disableUI: function (player) {
        // Update UI to reflect 'dead' status
        var ui = player.name;
        var statsBar = document.querySelector('.' + ui);
        var btn = document.querySelector('[data-player=' + ui + ']');

        btn.removeEventListener('click', delegateMove);
        btn.setAttribute('disabled', '');
        btn.innerText = 'DEAD!';
        statsBar.classList.add('dead');
    },

    addDebuff: function (player, debuff) {
        // Update UI to reflect 'debuff' status
        var ui = player.name;
        var statsBar = document.querySelector('.' + ui);
        if (!statsBar.classList.contains(debuff)) {
            statsBar.classList.add(debuff);
        }
    },

    removeDebuff: function (player, debuff) {
        var ui = player.name;
        var statsBar = document.querySelector('.' + ui);

        statsBar.classList.remove(debuff);
    }
};

/********************\
 **** DISPATCHER ****
\********************/
var delegateMove = function () {
    var player = this.dataset.player;
    var moveList = document.querySelector('.' + player + ' .js-movesList');
    var _move = moveList.value;
    var chosenOpponent = document.querySelector('input[name^=' + player + ']:checked').value;
    var opponent;

    for (var i = 0; i < players.length; i++) {
        if (players[i].name === chosenOpponent) {
            opponent = players[i];
            break;
        }
    }

    for (var j = 0; j < players.length; j++) {
        if (players[j].name === player) {
            // Need to get the opponent here.
            players[j].move(_move, opponent);
            break;
        }
    }
};

/********************\
 ** GAME TEST AREA **
\********************/

var player1 = new Character('Bob', 'paladin');
var player2 = new Character('Dave', 'warrior');
Object.observe(player1, observer);
Object.observe(player2, observer);