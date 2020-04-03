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

const concept = "world";


const IDontCareAboutFirebaseAuth = () => {
    return <div>This part won't react to firebase auth changes</div>;
};

const App = () => {
    return (
        <div>
            <IDontCareAboutFirebaseAuth />
            <FirebaseAuthProvider {...config} firebase={firebase}>
                <State initial={{ isLoading: false }}>
                    {({ state, setState }) => (
                        <React.Fragment>
                            <div>isLoading : {JSON.stringify(state.isLoading)}</div>
                            <IfFirebaseAuthed>
                                {() => {
                                    return  (
                                    <div>
                                        <h2>You're signed in 🎉 </h2>
                                        <p></p>
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
                                    return  (
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