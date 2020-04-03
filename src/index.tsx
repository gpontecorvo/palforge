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

const displayUserInfo = (profile ) => {
    return (
        <div>
            {/*<br/><br/>{JSON.stringify(user.providerData)}<br/><br/>*/}
            {
                //user.providerData.forEach(function (profile) {

                        <div>
                            <img className={"profileImg"} src={profile  ? profile.photoURL : require('/resources/anonymous.png')}/>
                            <table>
                                <thead>
                                <tr>
                                    <td>Sign-in provider:</td>
                                    <td>{profile  ? profile.providerId: "Anonymous"}</td>
                                </tr>
                                </thead>
                                <tbody>
                                {/*<tr>*/}
                                {/*    <td>Provider-specific UID:</td>*/}
                                {/*    <td> {profile.uid}</td>*/}
                                {/*</tr>*/}
                                {profile && <tr>
                                    <td>Name:</td>
                                    <td>{profile.displayName} </td>
                                </tr>}
                                {profile && <tr>
                                    <td>Email:</td>
                                    <td>{profile.email}</td>
                                </tr>}
                                {/*<tr>*/}
                                {/*    <td>Photo URL:</td>*/}
                                {/*    <td><img className={"contain"} src={profile.photoURL}/></td>*/}
                                {/*</tr>*/}

                                </tbody>
                            </table>
                        </div>

                //})
            }
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
                                    return (
                                        <div>
                                            <h4>You're signed in 🎉 </h4>
                                            {displayUserInfo(firebase.auth().currentUser.providerData[0])}
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