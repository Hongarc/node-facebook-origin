'use strict';

const log = require('kiat-log');
let id;

module.exports = {
    url: 'https://www.facebook.com/ajax/add_friend/action.php',
    init: _id => {
        id = _id;
    },
    getForm: () => ({
        to_friend: id,
        action: 'add_friend',
        how_found: 'profile_button',
    }),
    onSuccess: () => {
        log.info('addFriend', id);
    },
    onFailure: error => {
        log.error('addFriend', error);
    }
};
