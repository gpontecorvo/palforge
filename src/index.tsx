import * as React from "react";
import {render} from "react-dom";
import Palforge from "./Palforge"

import {
    FirebaseAuthProvider,
    IfFirebaseAuthed,
    IfFirebaseUnAuthed
} from "@react-firebase/auth";
import * as firebase from "firebase/app";
import {config} from "./firebase";
import {State} from "react-powerplug";


const IDontCareAboutFirebaseAuth = () => {
    return <div>This part won't react to firebase auth changes</div>;
};

const displayUserInfo = (profile: firebase.UserInfo | null, isAnonymous: boolean) => {
    console.log("2 " + JSON.stringify(profile));
    return (
        <div>
            <img className={"profileImg"} alt={"Anonymous"}
                 src={profile && profile.photoURL || require('./resources/anonymous.png')}/>
            <table>
                <thead>
                <tr>
                    <td colSpan={2}>{!isAnonymous ? profile && profile.providerId : "Anonymous"}</td>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>Name:</td>
                    <td>{!isAnonymous ? profile && profile.displayName  || profile && profile.email: firebase.auth().currentUser!.uid}</td>
                </tr>
                <tr>
                    <td>Email:</td>
                    <td>{!isAnonymous ? profile && profile.email : " "}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}


// export const accountCreate = functions.auth.user().onCreate((user: { data: { email: any; displayName: any; uid: any; }; }) => {
//     console.log(user.data);
//     userDoc = {'email' = user.data.email,
//         'displayName' = user.data.displayName}
//     admin.firestore().collection('users').doc(user.data.uid)
//         .set(userDoc).then(writeResult => {
//         console.log('User Created result:', writeResult);
//         return;
//     }).catch(err => {
//         console.log(err);
//         return;
//     });
// });



const App = () => {
    // firebase.auth().createUserWithEmailAndPassword("gpontecorvo@yahoo.com", "gr8fulDead252561").catch(function(error) {
    //     console.log(error);
    // });
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
                                    console.log (JSON.stringify(firebase.auth().currentUser));
                                    // @ts-ignore
                                    var isAnonymous = firebase.auth().currentUser.isAnonymous;
                                    return (
                                        <div>
                                            <h4>You're signed in <span role="img" aria-label="weird emoji" >🎉 </span></h4>
                                            {
                                                //displayUserInfo(firebase.auth().currentUser.providerData[0], true)
                                                <ol>

                                                    {
                                                        (isAnonymous) ?
                                                            <li>{displayUserInfo(null, isAnonymous)}</li> :


                                                            firebase.auth().currentUser!.providerData.map((profile, i) => {
                                                            return <li key={i}>{displayUserInfo(profile, isAnonymous)}</li>;
                                                            })

                                                    }
                                                </ol>
                                            }

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
                                            <div>
                                                <Palforge/>
                                            </div>
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
                                            <button
                                                onClick={async () => {
                                                    setState({isLoading: true});
                                                   // const emailAuthProvider = new firebase.auth.EmailAuthProvider();

                                                    firebase.auth().signInWithEmailAndPassword("gpontecorvo@yahoo.com", "gr8fulDead252561").catch(function(error) {
                                                        console.log(error);
                                                    });
                                                    setState({isLoading: false});
                                                }}
                                            >
                                                Sign in with email
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