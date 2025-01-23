const crypto = require('crypto');
const readlineSync = require('readline-sync');
const yargs = require('yargs');

// Dice Configuration Parser
class DiceParser {
    static parseDiceConfig(args) {
        if (args.length < 3) {
            console.error('Error: You need to provide at least 3 dice configurations.');
            console.log('Example: node game.js "2,2,4,4,9,9" "6,8,1,1,8,6" "7,5,3,7,5,3"');
            process.exit(1);
        }

        return args.map((arg) => {
            const dice = arg.split(',').map(Number);
            if (dice.length !== 6 || dice.some(isNaN)) {
                console.error('Error: Dice configuration must contain exactly 6 comma-separated integers.');
                console.log('Example: node game.js "2,2,4,4,9,9" "6,8,1,1,8,6" "7,5,3,7,5,3"');
                process.exit(1);
            }
            return dice;
        });
    }
}

// Secure Random Number Generation Class
class SecureRandom {
    static generateKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    static generateRandomNumber(range) {
        const randomBytes = crypto.randomBytes(32); // 256 bits for security
        const randomInt = parseInt(randomBytes.toString('hex').substring(0, 8), 16); // Convert to integer
        return randomInt % range;
    }

    static generateHMAC(key, message) {
        return crypto.createHmac('sha3-256', key).update(message).digest('hex');
    }
}

// Game Logic Class
class DiceGame {
    constructor(diceConfigs) {
        this.diceConfigs = diceConfigs;
        this.firstMovePlayer = null;
        this.computerScore = 0;
        this.userScore = 0;
    }

    // Function to determine who goes first
    determineFirstMove() {
        const key = SecureRandom.generateKey();
        const randomNumber = SecureRandom.generateRandomNumber(2); // 0 or 1
        const hmac = SecureRandom.generateHMAC(key, randomNumber.toString());
        console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);
        return randomNumber;
    }

    // Function to simulate rolling the dice
    rollDice(dice) {
        const index = SecureRandom.generateRandomNumber(dice.length);
        return dice[index];
    }

    // Function to display the game menu
    displayMenu(options) {
        console.log('Try to guess my selection.');
        options.forEach((opt, idx) => console.log(`${idx} - ${opt}`));
        console.log('X - exit');
        console.log('? - help');
    }

    // Function to handle the first move decision
    firstMove() {
        console.log("Let's determine who makes the first move.");
        const move = this.determineFirstMove();
        this.displayMenu([0, 1]);
        const userChoice = readlineSync.questionInt('Your selection: ');

        if (userChoice === 'X') {
            console.log('Exiting...');
            process.exit(0);
        }

        const key = SecureRandom.generateKey();
        const hmac = SecureRandom.generateHMAC(key, move.toString());

        console.log(`My selection: ${move} (KEY=${key}).`);
        this.firstMovePlayer = move === 0 ? 'computer' : 'user';
        console.log(`I make the first move and choose the [${this.diceConfigs[move]}] dice.`);
    }

    // Function to handle dice selection
    userDiceSelection() {
        console.log('Choose your dice:');
        this.diceConfigs.forEach((dice, idx) => {
            console.log(`${idx} - ${dice.join(', ')}`);
        });
        console.log('X - exit');
        console.log('? - help');
        const userChoice = readlineSync.questionInt('Your selection: ');

        if (userChoice === 'X') {
            console.log('Exiting...');
            process.exit(0);
        }

        this.userScore = this.rollDice(this.diceConfigs[userChoice]);
        console.log(`You choose the [${this.diceConfigs[userChoice]}] dice.`);
    }

    // Function to handle the throw (HMAC and result)
    throwDice() {
        console.log("It's time for my throw.");
        const randomValue = SecureRandom.generateRandomNumber(6); // 0..5
        const key = SecureRandom.generateKey();
        const hmac = SecureRandom.generateHMAC(key, randomValue.toString());
        console.log(`I selected a random value in the range 0..5 (HMAC=${hmac}).`);

        console.log('Add your number modulo 6.');
        const userChoice = readlineSync.questionInt('Your selection: ');

        if (userChoice === 'X') {
            console.log('Exiting...');
            process.exit(0);
        }

        const computerNumber = SecureRandom.generateRandomNumber(6);
        console.log(`My number is ${computerNumber} (KEY=${key}).`);
        const result = (userChoice + computerNumber) % 6;
        console.log(`The result is ${computerNumber} + ${userChoice} = ${result} (mod 6).`);
    }

    // Start the game flow
    play() {
        this.firstMove();
        this.userDiceSelection();
        this.throwDice();
    }
}

// Main Function to initialize the game
function main() {
    const args = yargs.argv._;
    const diceConfigs = DiceParser.parseDiceConfig(args);
    const game = new DiceGame(diceConfigs);
    game.play();
}

main();
