//import * as firebase from 'firebase';

const firebase = require("firebase/app");

// Required for side-effects
require("firebase/firestore");
require("firebase/auth");



export const config = {
    apiKey: 'AIzaSyCso_rZ5fBlTnGDfo8wt-uOvbQ71mWi1kI',
    authDomain: 'palforge-7c736.firebaseapp.com',
    projectId: 'palforge-7c736',
    databaseURL: "https://palforge-7c736.firebaseio.com",
};

export default !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();

