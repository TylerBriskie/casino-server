var express = require('express');

const router = express.Router();
require('dotenv').config();
const request = require('request');
const axios = require('axios');

// LOCAL IMPORTS
const User = require('../models/User');



// GAME PHASES

const NO_GAME = 'NO_GAME';
const PLACE_YOUR_BETS = "PLACE_YOUR_BETS";
const PLAYER_TURN = "PLAYER_TURN";
const DEALER_TURN = "DEALER_TURN";
const PAYOUT = "PAYOUT";

// LOCAL "STATE"
let dealer = {
    hasBlackjack: false,
    cards: [],
    value: 0,
    seat: 5,
}

let player = {
    name: '',
    hasBlackjack: false,
    canSplit: false,
    canDoubleDown: false,
    cards: [],
    value: 0,
    currentWager: 0,
    seat: 1
}

let gamePhase = "NO_GAME"
let deckId;
let deckCount = 6;
let unshuffledDeck = [];
let deck = [];


const NEW_UNSHUFFLED_PACK = [
'AS', 'KS', 'QS', 'JS', '0S', '9S', '8S', '7S', '6S', '5S', '4S', '3S', '2S',
'AC', 'KC', 'QC', 'JC', '0C', '9C', '8C', '7C', '6C', '5C', '4C', '3C', '2C',
'AD', 'KD', 'QD', 'JD', '0D', '9D', '8D', '7D', '6D', '5D', '4D', '3D', '2D',
'AH', 'KH', 'QH', 'JH', '0H', '9H', '8H', '7H', '6H', '5H', '4H', '3H', '2H',
];





router.post('/newHand', async (req, res, next) =>{
    console.log(req.body);
    // CHECK TO SEE IF PLAYER IS LOGGED IN OR GUEST
    if (req.body.id === "GUEST"){
        console.log('new game with guest account');
        player = {
            id: "GUEST",
            name: "Guest",

            cards: [],
            value: 0,
            currentWager: req.body.player.wager,
            // SEAT NUMBER WILL BE USED FOR MULTIPLAYER
            seat: 1
        }
    } else {
        // FIND USER IN DB AND DEDUCT CREDITS FOR THEIR BET
        let user = await User.findOne({_id: req.body.id});
        user.credits -= req.body.player.wager;
        await user.save();
        
        player = {
            id: user._id,
            name: user.display_name,

            cards: [],
            value: 0,
            currentWager: req.body.player.wager,
            // SEAT NUMBER WILL BE USED FOR MULTIPLAYER
            seat: 1
        }
        
    
     
    }
 

    dealer = {
        hasBlackjack: false,
        cards: [],
        value: 0,
        seat: 5,
    }

    // SHUFFLE NEW DECK OF CARDS IF LESS THAN 30 IN DECK
    if (deck.length < 30){
        shuffleCards();     
    } 

    player.cards.push(deck.pop());
    dealer.cards.push(deck.pop());
    player.cards.push(deck.pop());
    dealer.cards.push(deck.pop());

    // CALCULATE PLAYER SCORE
    player.value = calculateScore(player.cards);

    // CHECK PLAYER OPTIONS - DOUBLE DOWN, SPLIT, ETC
    checkPlayerOptions();

    gamePhase = PLAYER_TURN;

    res.status(200).send({
        player,
        dealer: {
            cards: dealer.cards[1],
            shown: lookupCardValue(dealer.cards[1]),
        }
    })
    
        
})

router.post('/hitme', (req, res, next) => {
    console.log( req.body)
    player.cards.push(deck.pop());
    player.value = calculateScore(player.cards);

    res.status(200).send({player})
});

router.post('/dealer-turn', async (req, res, next) => {
    console.log(gamePhase);
    if (gamePhase === NO_GAME){
        res.status(500).send("no game in progress")
    } else if (gamePhase === PLAYER_TURN){
        
        gamePhase = DEALER_TURN
         // DEALER DEALS THEMSELVES CARDS

         dealer.revealedCard = lookupCardValue(dealer.cards[0]);
         dealer.value = calculateScore(dealer.cards);
         dealer.initialScore = dealer.value;

         while(dealer.value < 17){
            console.log('dealer takes a card - ', dealer.value);
            
            dealer.cards.push(deck.pop());
            dealer.value = calculateScore(dealer.cards);
            
         }         

         // DEALER IS DONE TAKING CARDS, CALCULATE WINNER / PAYOUT
         console.log("WAGER: " + player.wager)
         if ((dealer.value < player.value && player.value <= 21) ||
         (dealer.value > 21 && player.value <= 21 )){
            // PLAYER WINS
            let user = await User.findOne({_id: player.id});
            
            // PAYOUT
            user.credits += (2*player.currentWager);
            await user.save();

            // RESET PLAYER WAGER
            player.wager = 0;

            // SEND RESPONSE
            res.send({
                player,
                dealer,
                gamePhase: PAYOUT,
                winner: "PLAYER"
            })
         } else {
            // RESET PLAYER WAGER
            player.wager = 0;

            res.send({
                player,
                dealer,                
                gamePhase: PAYOUT,
                winner: "DEALER"
            })
         }

    } else {
        res.send('not dealer turn');
    }

});

// router.get('/score', (req, res, next) => {

//     calculateScore(player.cards, player.seat);
//     res.status(200).send({score});

// });


// HELPER FUNCTIONS

const calculateScore = (cards) => {
    
        let score = 0;
        let aceCount = 0;

        cards.forEach(card => {
            let value = card.split('')[0];
            switch(value){
                case "2":
                    score += 2;
                    return;
                case "3":
                    score += 3;
                    return;
                case "4":
                    score += 4;
                    return;
                case "5":
                    score += 5;
                    return;
                case "6":
                    score += 6;
                    return;
                case "7":
                    score += 7;
                    return;
                case "8":
                    score += 8;
                    return;
                case "9":
                    score += 9;
                    return;
                case "0":
                    score += 10;
                    return;
                case "J":
                    score += 10;
                    return;
                case "Q":
                    score += 10;
                    return;
                case "K":
                    score += 10;
                    return;
                case "A":
                    aceCount++;
                    score += 11;
                    return;
                default: 
                    return;
            }
    
            
            
        });

        // SCORE === "SOFT" VALUE OF HAND - EACH ACE COUNTED AS A 11 AND NOT 1
        for (let i = 0; i < aceCount; i++){
            if (score > 21){
                score -= 10;
            }
        }


        // SET DOUBLE DOWN / SPLITABLE / BLACKJACK
        // if(cards.length === 2){
        //      // ONLY TWO CARDS && SCORE OF 21 === BLACKJACK
        //     if (score === 21){
        //         p.hasBlackjack = true;
        //     }

        //     //  SAME VALUE === SPLITABLE
        //     if (p.cards[0].split('')[0] === p.cards[1].split('')[0]){
        //         p.canSplit = true;
        //     }

        //     if (score === 9 || score === 10 || score === 11){
        //         p.canDoubleDown = true;
        //     } 

        // }

        return score;

}


const checkPlayerOptions = () => {
    // console.log('checking...');
    if (player.cards.length === 2){
        if (player.value === 21){
            player.hasBlackjack = true;
        }
        if (player.cards[0].split('')[0] === player.cards[1].split('')[0]){
            player.canSplit = true;
        }
        if (player.value === 9 || player.value === 10 || player.value === 11){
            player.canDoubleDown = true;
        }
    } else {
        player.hasBlackjack = false;
        player.canDoubleDown = false;
        player.canSplit = false;
    }
}



// LOOKUP CARD VALUE
const lookupCardValue = (card) => {
    switch (card.split('')[0]){

        case "0":
            return "10";
        case "J":
            return "Jack";
        case "Q":
            return "Queen";
        case "K":
            return "King";
        case "A":
            return "Ace";
        default: 
            return card.split('')[0]; 
    }
}

// SHUFFLE CARDS

const shuffleCards = () => {
    
    // "OPEN" NEW "PACKS" OF CARDS AND ADD THEM TO GAME DECK
    for (let i = 0; i < deckCount; i++){
        unshuffledDeck = unshuffledDeck.concat(NEW_UNSHUFFLED_PACK); 
    }


    // SHUFFLE GAME DECK
    while (unshuffledDeck.length > 0){
        let randomIndex = Math.floor(Math.random()*unshuffledDeck.length)
        deck.push(unshuffledDeck.splice(randomIndex, 1)[0])
    }

    
    return deck;
}

module.exports = router;

