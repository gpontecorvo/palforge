import * as React from "react";
import {render} from "react-dom";
import Palforge from "./Palforge"

import {
    FirebaseAuthConsumer,
    FirebaseAuthProvider,
    IfFirebaseAuthed,
    IfFirebaseUnAuthed
} from "@react-firebase/auth";
import * as firebase from "firebase/app";
import {config} from "./firebase";
import {State} from "react-powerplug";
// @ts-ignore
import functions from "firebase";



const concept = "world";


const IDontCareAboutFirebaseAuth = () => {
    return <div>This part won't react to firebase auth changes</div>;
};

const displayUserInfo = (profile, isAnonymous) => {
    //console.log("2 " + JSON.stringify(profile));
    return (
        <div>
            <img className={"profileImg"}
                 src={!isAnonymous ? profile.photoURL : require('/resources/anonymous.png')}/>
            <table>
                <thead>
                <tr>
                    <td colSpan={2}>{!isAnonymous ? profile.providerId : "Anonymous"}</td>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>Name:</td>
                    <td>{!isAnonymous && profile.displayName}</td>
                </tr>
                <tr>
                    <td>Email:</td>
                    <td>{!isAnonymous && profile.email}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}


const App = () => {
    return (
        <div>
            <IDontCareAboutFirebaseAuth/>
            <FirebaseAuthProvider {...config} firebase={firebase}>
                <State initial={{isLoading: false}}>
                    {({state, setState}) => (
                        <React.Fragment>
                            <div>isLoading : {JSON.stringify(state.isLoading)}</div>
                            <IfFirebaseAuthed>
                                {() => {
//                                    console.log (JSON.stringify(firebase.auth().currentUser));
                                    var isAnonymous = firebase.auth().currentUser.isAnonymous;
                                    return (
                                        <div>
                                            <h4>You're signed in 🎉 </h4>
                                            {
                                                // displayUserInfo(firebase.auth().currentUser.providerData[0])
                                                <ol>

                                                    {
                                                        (isAnonymous) ?
                                                            <li>{displayUserInfo(null, isAnonymous)}</li> :

                                                            firebase.auth().currentUser.providerData.map((profile, i) => {
                                                            //console.log(JSON.stringify("1 " + profile));
                                                            return <li key={i}>{displayUserInfo(profile, isAnonymous)}</li>;
                                                            })

                                                    }
                                                </ol>
                                            }

                                            <div>
                                                <Palforge/>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    setState({isLoading: true});
                                                    await firebase
                                                        .app()
                                                        .auth()
                                                        .signOut();
                                                    setState({isLoading: false});
                                                }}
                                            >
                                                Sign out
                                            </button>
                                        </div>)
                                }}
                            </IfFirebaseAuthed>
                            <IfFirebaseUnAuthed>
                                {() => {
                                    return (
                                        <div>
                                            <h2>You're not signed in </h2>
                                            <button
                                                onClick={async () => {
                                                    setState({isLoading: true});
                                                    await firebase
                                                        .app()
                                                        .auth()
                                                        .signInAnonymously();
                                                    setState({isLoading: false});
                                                }}
                                            >
                                                Sign in anonymously
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setState({isLoading: true});
                                                    const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
                                                    firebase.auth().signInWithPopup(googleAuthProvider);
                                                    setState({isLoading: false});
                                                }}
                                            >
                                                Sign in with Google
                                            </button>
                                        </div>)
                                }}
                            </IfFirebaseUnAuthed>
                        </React.Fragment>
                    )}
                </State>
            </FirebaseAuthProvider>
        </div>
    );
};


render(<App/>, document.getElementById("root"));