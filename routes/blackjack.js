var express = require('express');
const bcrypt = require ('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();
const { check, validationResult } = require('express-validator');
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

let players = []

let player = {
    name: '',
    hasBlackjack: false,
    cards: [],
    value: 0,
    currentWager: 0,
    seat: 1
}

let deckId;
let cards = [];

router.post('/newPlayer', (req, res, next) =>{
    if (players.length >= 4){
        res.send('too many players already sittin...');
    } else {
        const newPlayer = {

            name: req.body.name,
            credits: req.body.credits
        }

        players.push(newPlayer)
        res.send("new player sitting at seat " + req.body.seat_number);
    }

})

router.post('/newHand', (req, res, next) =>{
    // CLEAR PLAYER AND DEALER HANDS
    console.log(req.body.players);
    player = {
        hasBlackjack: false,
        cards: [],
        value: 0,
        currentWager: req.body.players[0].wager,
        seat: 1,
    }

    dealer = {
        hasBlackjack: false,
        cards: [],
        value: 0,
        seat: 5,
    }

    console.log('cards left: ', cards.length);

    if (cards.length < 20){
        axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
        .then(response => {
            deckId = response.data.deck_id;
            return axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=312`)
        })
        .then(response => {
            cards = response.data.cards.map(c => c.code);
            player.cards.push(cards.pop());
            dealer.cards.push(cards.pop());
            player.cards.push(cards.pop());
            dealer.cards.push(cards.pop());
            res.status(200).send({
                player,
                dealer: {
                    cards: [dealer.cards[0]],
                    value: dealer.value
                }
            })
        })
    } else {
        player.cards.push(cards.pop());
        dealer.cards.push(cards.pop());
        player.cards.push(cards.pop());
        dealer.cards.push(cards.pop());

        res.status(200).send({
            players: [player],
            dealer: {
                cards: dealer.cards,
                value: dealer.value
            }
        })
    }
    
       
        
})

router.post('/hitme', (req, res, next) => {
    console.log("player in seat " + req.body.seat + " requests a card...")
    player.cards.push(cards.pop());
    res.status(200).send({player})
});


module.exports = router;

