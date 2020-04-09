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
import User from "firebase";


// const IDontCareAboutFirebaseAuth = () => {
//     return <div>This part won't react to firebase auth changes</div>;
// };

const displayUserInfo = (profile: firebase.UserInfo | null, isAnonymous: boolean) => {
    return (
        <div>
            <img className={"profileImg"} alt={"Anonymous"}
                 src={(profile?.photoURL) || require('./resources/anonymous.png')}/>
            <table>
                <thead>
                <tr>
                    <td colSpan={2}>{!isAnonymous ? profile?.providerId : "Anonymous"}</td>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>Name:</td>
                    <td>{(profile?.displayName) || (profile?.email) || firebase.auth().currentUser?.uid}</td>
                </tr>
                <tr>
                    <td>Email:</td>
                    <td>{!isAnonymous ? profile && profile.email : " "}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

// const  listAllUsers = (nextPageToken : any) => {
//     // List batch of users, 1000 at a time.
//     admin.auth().listUsers(1000, nextPageToken)
//         .then(function(listUsersResult) {
//             listUsersResult.users.forEach(function(userRecord) {
//                 console.log('user', userRecord.toJSON());
//             });
//             if (listUsersResult.pageToken) {
//                 // List next batch of users.
//                 listAllUsers(listUsersResult.pageToken);
//             }
//         })
//         .catch(function(error) {
//             console.log('Error listing users:', error);
//         });
// }


const userColumns = ["uid", "displayName", "photoURL", "email", "emailVerified", "phoneNumber",
    "isAnonymous", "providerData", "lastLoginAt", "createdAt"];

// @ts-ignore
const addUserToDb = (user: User.User) => {
    const userJSON: any = user.toJSON();
    const theJson = Object.keys(userJSON).reduce((obj: any, key) => {
        if (userColumns.includes(key)) {
            obj[key] = userJSON[key];
        }
        return obj;
    }, {});

    console.log("addingUsertoDB:\n", JSON.stringify(theJson));

    // let db = firebase.firestore();
    // db.collection("users").doc(theJson.uid).set({
    //     displayName: theJson.displayName,
    //     photoURL: theJson.photoURL,
    //     email: theJson.email,
    //     emailVerified: theJson.emailVerified,
    //     phoneNumber: theJson.phoneNumber,
    //     isAnonymous: theJson.isAnonymous,
    //     providerData: theJson.providerData![0].providerId,
    //     lastLoginAt: theJson.lastLoginAt,
    //     createdAt: theJson.createdAt,
    // }, {merge: true}).then(function () {
    //     console.log("Document successfully written to \"users\" collection");
    // }).catch(function (error) {
    //     console.error("Error writing document: ", error);
    // });
};

// firebase.auth().onAuthStateChanged(function (user) {
//     if (user) {
//         addUserToDb(user);
//         setState({
//             isLoading: false,
//             currentUserUid: user.uid
//         });
//
//     } else {
//         // removeAnonymousUsersandData();
//
//         console.log(
//             "User is signed out"
//         )
//         // setState({
//         //     isLoading: false,
//         //     currentUserUid: "none"
//         // });
//     }
// });


const App = () => {
    // firebase.auth().createUserWithEmailAndPassword("gpontecorvo@yahoo.com", "gr8fulDead252561").catch(function(error) {
    //     console.log(error);
    // });

    return (
        <div>
            <div>
                <State initial={
                    {
                        isLoading: false,
                        currentUserUid: "init",
                        hookLoaded: false
                    }
                }>
                    {({state, setState}) => (
                        <React.Fragment>
                            {/*<IDontCareAboutFirebaseAuth/>*/}
                            <div>
                                <h3>The Palindrome Forge<br/>
                                    <span
                                        className={"even-smaller"}>&copy;2020 Greg Pontecorvo. All rites observed.</span>
                                </h3>
                                <h5>{state.currentUserUid}</h5>
                            </div>
                            <FirebaseAuthProvider {...config} firebase={firebase}>
                                {() => {
                                    if (!state.hookLoaded) {
                                        setState({
                                            hookLoaded: true
                                        });
                                        firebase.auth().onAuthStateChanged(function (user) {
                                            if (user) {
                                                addUserToDb(user);
                                                setState({
                                                    //isLoading: false,
                                                    currentUserUid: user.uid
                                                });

                                            } else {
                                                // removeAnonymousUsersandData();

                                                console.log(
                                                    "User is signed out ", state.currentUserUid
                                                )
                                                setState({
                                                    //isLoading: false,
                                                    currentUserUid: "none"
                                                });
                                            }
                                        });
                                    }

                                     return (
                                        <div>
                                            <IfFirebaseAuthed>
                                                {() => {
                                                    // console.log (JSON.stringify(firebase.auth().currentUser));

                                                    //var isAnonymous = false;
                                                    console.log(firebase.auth().currentUser); // ? false : firebase.auth().currentUser!.isAnonymous;

                                                    return (
                                                        <div>
                                                            <h5>Signed in <span role="img"
                                                                                aria-label="weird emoji">🎉 </span></h5>
                                                            <div>{state.isLoading ? "Loading . . . " : "Loaded"}</div>
                                                            <div>Current User Id {state.currentUserUid}</div>
                                                            {
                                                                displayUserInfo(firebase.auth().currentUser?.providerData ?
                                                                    firebase.auth().currentUser!.providerData[0] :
                                                                    null, false)
                                                                // <ol>
                                                                //
                                                                //     {
                                                                //         (isAnonymous) ?
                                                                //             <li>{displayUserInfo(null, isAnonymous)}</li> :
                                                                //
                                                                //
                                                                //             firebase.auth().currentUser!.providerData.map((profile, i) => {
                                                                //                 return <li
                                                                //                     key={i}>{displayUserInfo(profile, isAnonymous)}</li>;
                                                                //             })
                                                                //
                                                                //     }
                                                                // </ol>
                                                            }

                                                            <button
                                                                onClick={async () => {
                                                                    setState({isLoading: true});
                                                                    await firebase
                                                                        .app()
                                                                        .auth()
                                                                        .signOut();
                                                                    setState({
                                                                        isLoading: false,
                                                                        currentUserUid: "none"
                                                                    });
                                                                }}
                                                            >
                                                                Sign out
                                                            </button>
                                                            <div className={"palForge"}>
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
                                                                    setState({
                                                                        isLoading: false,
                                                                        currentUserUid: firebase.auth().currentUser!.uid
                                                                    });
                                                                }}
                                                            >
                                                                Sign in anonymously
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    setState({isLoading: true});
                                                                    const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
                                                                    firebase.auth().signInWithPopup(googleAuthProvider);
                                                                    setState({
                                                                        isLoading: false,
                                                                        currentUserUid: firebase.auth().currentUser?.uid
                                                                    });
                                                                }}
                                                            >
                                                                Sign in with Google
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    setState({isLoading: true});
                                                                    // const emailAuthProvider = new firebase.auth.EmailAuthProvider();

                                                                    firebase.auth().signInWithEmailAndPassword("gpontecorvo@yahoo.com", "gr8fulDead252561").catch(function (error) {
                                                                        console.log(error);
                                                                    });
                                                                    setState({
                                                                        isLoading: false,
                                                                        currentUserUid: firebase.auth().currentUser!.uid
                                                                    });
                                                                }}
                                                            >
                                                                Sign in with email
                                                            </button>
                                                        </div>)
                                                }}
                                            </IfFirebaseUnAuthed>
                                        </div>)
                                }}
                            </FirebaseAuthProvider>
                        </React.Fragment>
                    )}
                </State>
            </div>
        </div>
    );
};


render(<App/>, document.getElementById("root"));