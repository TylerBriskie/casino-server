var express = require('express');

const router = express.Router();
require('dotenv').config();
const request = require('request');
const axios = require('axios');

// LOCAL IMPORTS
const User = require('../models/User');


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





router.post('/newHand', (req, res, next) =>{
    // CLEAR PLAYER AND DEALER HANDS


    console.log(req.body);
    player = {
        name: req.body.player.name,
        hasBlackjack: false,
        cards: [],
        value: 0,
        currentWager: req.body.player.wager,
        seat: req.body.s,
    }

    dealer = {
        hasBlackjack: false,
        cards: [],
        value: 0,
        seat: 5,
    }

    console.log('cards left: ', deck.length);

    if (deck.length < 30){
        shuffleCards();
        
     
    } 

    player.cards.push(deck.pop());
    dealer.cards.push(deck.pop());
    player.cards.push(deck.pop());
    dealer.cards.push(deck.pop());

    player.value = calculateScore(player.cards);

    checkPlayerOptions();


    res.status(200).send({
        player,
        dealer: {
            cards: dealer.cards,
            value: dealer.value
        }
    })
    
        
})

router.post('/hitme', (req, res, next) => {
    console.log( req.body)
    player.cards.push(cards.pop());
    player.value = calculateScore(player.cards);

    res.status(200).send({player})
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
    console.log('checking...');
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


// SHUFFLE CARDS

const shuffleCards = () => {
    
    // "OPEN" NEW "PACKS" OF CARDS AND ADD THEM TO GAME DECK
    for (let i = 0; i < deckCount; i++){
        console.log('adding pack...');
        unshuffledDeck = unshuffledDeck.concat(NEW_UNSHUFFLED_PACK); 
    }

    console.log(unshuffledDeck);

    // SHUFFLE GAME DECK
    while (unshuffledDeck.length > 0){
        let randomIndex = Math.floor(Math.random()*unshuffledDeck.length)
        deck.push(unshuffledDeck.splice(randomIndex, 1)[0])
    }

    console.log('shuffled deck: ', deck);
    
    return deck;
}

module.exports = router;

