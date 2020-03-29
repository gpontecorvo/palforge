//import * as firebase from 'firebase';

const firebase = require("firebase/app");
// Required for side-effects
require("firebase/firestore");



let config = {
    apiKey: 'AIzaSyCso_rZ5fBlTnGDfo8wt-uOvbQ71mWi1kI',
    authDomain: 'palforge-7c736.firebaseapp.com',
    projectId: 'palforge-7c736'
};

export default !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();

