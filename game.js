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
        const randomBytes = crypto.randomBytes(32); 
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

    // Function to determine who goes first and roll results
    generateRolls() {
        const key = SecureRandom.generateKey();
        
        // Generate 3 random numbers: first move (0 or 1), user roll (0-5), computer roll (0-5)
        const computerFirst = SecureRandom.generateRandomNumber(2);  // 0 or 1 to decide who goes first
        const computerUserRoll = SecureRandom.generateRandomNumber(6);  // User roll value (0-5)
        const computerRoll = SecureRandom.generateRandomNumber(6);  // Computer roll value (0-5)
        
        // HMAC generation for each of the 3 values
        const hmacFirstMove = SecureRandom.generateHMAC(key, computerFirst.toString());
        const hmacUserRoll = SecureRandom.generateHMAC(key, computerUserRoll.toString());
        const hmacComputerRoll = SecureRandom.generateHMAC(key, computerRoll.toString());

        console.log(`Generated values: 
            Computer First: ${computerFirst} (HMAC=${hmacFirstMove}), 
            User Roll: ${computerUserRoll} (HMAC=${hmacUserRoll}), 
            Computer Roll: ${computerRoll} (HMAC=${hmacComputerRoll})`);

        return { computerFirst, computerUserRoll, computerRoll, key };
    }

    // Function to handle user input for their dice roll
    userRoll() {
        console.log('Please enter your roll for the game:');
        const userFirst = readlineSync.questionInt('Who goes first? (0 for computer, 1 for user): ');
        const userRoll = readlineSync.questionInt('Your roll value (0-5): ');
        const computerRoll = readlineSync.questionInt('Computer roll value (0-5): ');

        return { userFirst, userRoll, computerRoll };
    }

    firstMove() {
        const { computerFirst, computerUserRoll, computerRoll, key } = this.generateRolls();
        
        const { userFirst } = this.userRoll();
        
        this.firstMovePlayer = (computerFirst === userFirst) ? 
            (computerFirst === 0 ? 'computer' : 'user') :
            (Math.random() > 0.5 ? 'user' : 'computer');
        
        console.log(`First move goes to: ${this.firstMovePlayer}`);
        
        return { computerUserRoll, computerRoll, key };
    }

    play() {
        console.log("Let's start the game!");
        
        const { computerUserRoll, computerRoll, key } = this.firstMove();

        if (computerUserRoll > computerRoll) {
            console.log(`You win with a roll of ${computerUserRoll} vs ${computerRoll}!`);
        } else if (computerUserRoll < computerRoll) {
            console.log(`Computer wins with a roll of ${computerRoll} vs ${computerUserRoll}!`);
        } else {
            console.log(`It's a tie with a roll of ${computerUserRoll}!`);
        }
    }
}

function main() {
    const args = yargs.argv._;
    const diceConfigs = DiceParser.parseDiceConfig(args);
    const game = new DiceGame(diceConfigs);
    game.play();
}

main();
