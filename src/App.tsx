import * as React from "react";
import './index.css';
import './App.css';

import {
    FirebaseAuthProvider,
    IfFirebaseAuthed,
    IfFirebaseUnAuthed
} from "@react-firebase/auth";

import * as firebase from "firebase/app";
import {config} from "./firebase";
import {State} from "react-powerplug";
import {privacypolicy} from "./privacypolicy";
import Popup from "./Popup";
import PalindromeForge from "./PalindromeForge";

const APP_TITLE = "The Palindrome Forge";

const displayUserInfo =  (profile: firebase.UserInfo | null, isAnonymous: boolean) => {

    return (
        <div>
            <img className={"profileImg"} alt={"Profile"}
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
                    <td>{((profile?.displayName) || (profile?.email) || firebase.auth().currentUser?.uid)}
                    </td>
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


// not ready - may need this for anonymous login later
// const removeAnonymousData = (currentUserUid: string) => {
//     if (currentUserUid !== undefined) {
//         let db = firebase.firestore();
//         var docRef = db.collection("users").doc(currentUserUid);
//
//         docRef.get().then(function (doc) {
//             if (doc.exists) {
//                 console.log("User Document data:", doc.data());
//                 if (doc.data() && doc.data()!.isAnonymous) {
//                     // admin.auth().deleteUser(currentUserUid)
//                     //     .then(function () {
//                     //         console.log('Successfully deleted user');
//                     //     })
//                     //     .catch(function (error) {
//                     //         console.log('Error deleting user:', error);
//                     //     });
//                     firebaseHelper.firebase
//                         .deleteUsers([currentUserUid])
//                 }
//             } else {
//                 // doc.data() will be undefined in this case
//                 console.log("No such document!");
//             }
//         }).catch(function (error) {
//             console.log("Error getting document:", error);
//         });
//     }
//    console.log(
//         "in remove, User is  ", currentUserUid
//     )
// }


export const App = () => {
    document.title = APP_TITLE;

    return (
        <div>
            <div>
                <State initial={
                    {
                        currentAppUser: firebase.auth().currentUser,
                        currentUserIsAdmin: false,
                        privacypolicyshown: false,
                        showPrivacyPopup: false,
                        adminMode: false,
                        writeSuccessToLog: false
                    }
                }>
                    {
                        ({state, setState}) => (
                            <React.Fragment>
                                <div>
                                    <div className={"left-just"}>
                                        <img className={"App-logo"} alt={"logo"} height={"50px"}
                                             src={require('./resources/ourobouros.png')}/>

                                    </div>
                                    <div>
                                        <table className={"app-banner"}>
                                            <thead>
                                            </thead>
                                            <tbody>
                                            <tr>
                                                <td colSpan={2}>
                                                    <span className="app-title">The Palindrome Forge</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                <span
                                                    className={"smaller"}>version {require('../package.json').version}</span>
                                                </td>
                                                <td>
                                                    <span className={"even-smaller"}>&copy;2020 Greg Pontecorvo. All rites observed.</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2}>
                                                <span className={""}>
                                                     <button onClick={() => {
                                                         let shown = !state.showPrivacyPopup;
                                                         setState({
                                                             showPrivacyPopup: shown
                                                         });
                                                     }}>Show Privacy Policy</button>
                                                    {
                                                        state.showPrivacyPopup &&
                                                        <Popup
                                                            html={privacypolicy()}
                                                            buttonText={"Hide Privacy Policy"}
                                                            closePopup={() => {
                                                                let shown = !state.showPrivacyPopup;
                                                                setState({
                                                                    showPrivacyPopup: shown
                                                                })
                                                            }}
                                                        />
                                                    }
                                                 </span>
                                                </td>
                                            </tr>
                                            </tbody>
                                            <tfoot></tfoot>
                                        </table>
                                    </div>
                                </div>
                                <div className={"auth-content"}>
                                    <FirebaseAuthProvider {...config} firebase={firebase}>
                                        {() => {
                                            return (
                                                <div>
                                                    <IfFirebaseAuthed>
                                                        { () => {
                                                            var isAnonymous = typeof firebase.auth().currentUser?.isAnonymous == "undefined" ?
                                                                false : firebase.auth().currentUser!.isAnonymous
                                                            if (!state.currentAppUser) {
                                                                let currUser = firebase.auth().currentUser;
                                                               // getAppUser(firebase.auth().currentUser!.uid).then(function (result) {
                                                                    setState({
                                                                        // isLoading: false,
                                                                        currentAppUser: currUser
                                                                    });
                                                                //});
                                                            }
                                                            //console.log("authed \n", JSON.stringify(firebase.auth().currentUser)); // ? false : firebase.auth().currentUser!.isAnonymous;
                                                            return (
                                                                <div>
                                                                    <div className={"left-just"}>
                                                                        <div>
                                                                            <button className="pal-button"
                                                                                    onClick={async () => {
                                                                                        // setState({isLoading: true});
                                                                                        // var prevUserId = state.currentUserUid;
                                                                                        // console.log("in signout onclick ", prevUserId);
                                                                                        await firebase.auth().signOut();
                                                                                        // removeAnonymousData(prevUserId);
                                                                                        setState({
                                                                                            // isLoading: false,
                                                                                            currentAppUser: firebase.auth().currentUser
                                                                                        });
                                                                                    }}
                                                                            >
                                                                                Sign out
                                                                            </button>

                                                                        </div>
                                                                    </div>
                                                                    <div>{

                                                                    }</div>
                                                                    <div className={"left-just"}>
                                                                        {

                                                                             displayUserInfo(firebase.auth().currentUser?.providerData ?
                                                                                firebase.auth().currentUser!.providerData[0] :
                                                                                null, isAnonymous)
                                                                            // may need this is linking anonymous to another user
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

                                                                    </div>
                                                                    {state.currentAppUser !== undefined && state.currentAppUser &&
                                                                    state.currentUserIsAdmin &&


                                                                    <div className={"left-just"}>
                                                                        Admin Mode: {state.adminMode ? "ON " : "OFF"}
                                                                        <br/>
                                                                        <div>
                                                                            <button className="pal-button"
                                                                                    onClick={() => {
                                                                                        let theAdminMode = !state.adminMode;
                                                                                        setState({
                                                                                            adminMode: theAdminMode,
                                                                                        });
                                                                                    }}
                                                                            >
                                                                                {"Turn " + (state.adminMode ? "off " : "on ") + " Admin Mode"}
                                                                            </button>
                                                                        </div>
                                                                        {
                                                                            state.adminMode &&
                                                                            <div>
                                                                                Write Success to
                                                                                Log: {state.writeSuccessToLog ? "ON " : "OFF"}
                                                                                <br/>
                                                                                <button className="pal-button"
                                                                                        onClick={() => {
                                                                                            let toggle = !state.writeSuccessToLog;
                                                                                            setState({
                                                                                                writeSuccessToLog: toggle
                                                                                            });

                                                                                        }}
                                                                                >
                                                                                    {(state.writeSuccessToLog ? "Don't " : "") + "Write success to log"}
                                                                                </button>
                                                                            </div>
                                                                        }
                                                                    </div>}
                                                                    <div className={"clear-float clearfix"}></div>
                                                                    <div className={"palForge"}>
                                                                        <PalindromeForge
                                                                            adminMode={state.adminMode && state.currentUserIsAdmin}
                                                                            writeSuccessToLog={state.adminMode && state.currentUserIsAdmin && state.writeSuccessToLog}
                                                                        />
                                                                    </div>

                                                                </div>)
                                                        }}
                                                    </IfFirebaseAuthed>
                                                    <IfFirebaseUnAuthed>
                                                        {() => {
                                                            return (
                                                                <div>
                                                                    {/*<h5>Sign in:</h5>*/}
                                                                    {/*         Anonymous (future)          */}
                                                                    {/*<button*/}
                                                                    {/*    onClick={async () => {*/}
                                                                    {/*        // setState({isLoading: true});*/}
                                                                    {/*        await firebase*/}
                                                                    {/*            //.app()*/}
                                                                    {/*            .auth()*/}
                                                                    {/*            .signInAnonymously();*/}
                                                                    {/*        setState({*/}
                                                                    {/*            // isLoading: false,*/}
                                                                    {/*            currentUserUid: firebase.auth().currentUser!.uid*/}
                                                                    {/*        });*/}
                                                                    {/*    }}*/}
                                                                    {/*>*/}
                                                                    {/*    Sign in anonymously*/}
                                                                    {/*</button>*/}
                                                                    <div className={"button-with-icon"}>
                                                                        <button className="pal-button"
                                                                                onClick={async () => {
                                                                                    // setState({isLoading: true});
                                                                                    const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
                                                                                    firebase.auth().signInWithPopup(googleAuthProvider).then(async function (result) {
                                                                                        // This gives you a Google Access Token. You can use it to access the Google API.
                                                                                        // var token = result.credential.accessToken;
                                                                                        // The signed-in user info.
                                                                                        var user = result.user;
                                                                                        //console.log(" user ", user?.uid );


                                                                                        setState({
                                                                                            // isLoading: false,
                                                                                            currentAppUser: user
                                                                                        });
                                                                                    }).catch(function (error) {
                                                                                        // Handle Errors here.
                                                                                        var errorCode = error.code;
                                                                                        var errorMessage = error.message;
                                                                                        // The email of the user's account used.
                                                                                        var email = error.email;
                                                                                        // The firebase.auth.AuthCredential type that was used.
                                                                                        var credential = error.credential;

                                                                                        console.log("==== Google login error =====\n",
                                                                                            errorCode, "\n",
                                                                                            errorMessage, "\n",
                                                                                            email, "\n",
                                                                                            credential, "\n",
                                                                                            "==== =========== =====\n")
                                                                                        // ...
                                                                                    });

                                                                                    let callback: { (snapshot: any): void; (a: firebase.database.DataSnapshot, b?: string | null | undefined): any; } | null = null;
                                                                                    let metadataRef: firebase.database.Reference | null = null;
                                                                                    firebase.auth().onAuthStateChanged(async user => {
                                                                                        // Remove previous listener.
                                                                                        if (callback) {
                                                                                            metadataRef?.off('value', callback);
                                                                                        }
                                                                                        // On user login add new listener.
                                                                                        if (user) {
                                                                                            // Check if refresh is required.
                                                                                            metadataRef = firebase.database().ref('metadata/' + user.uid + '/refreshTime');
                                                                                            callback = (snapshot: any) => {
                                                                                                // Force refresh to pick up the latest custom claims changes.
                                                                                                // Note this is always triggered on first call. Further optimization could be
                                                                                                // added to avoid the initial trigger when the token is issued and already contains
                                                                                                // the latest claims.
                                                                                               // snapshot = snapshot;
                                                                                                console.log("=====\nsnapshot: \n", snapshot);
                                                                                                user.getIdToken(true);
                                                                                            };
                                                                                            // Subscribe new listener to changes on that node.
                                                                                            metadataRef.on('value', callback);

                                                                                            let isAdmin = false;

                                                                                            await  user?.getIdTokenResult()
                                                                                                .then((idTokenResult) => {
                                                                                                    // Confirm the user is an Admin.
                                                                                                    isAdmin = !!idTokenResult.claims.admin;
                                                                                                    setState({
                                                                                                        currentUserIsAdmin: isAdmin,
                                                                                                    });
                                                                                                    console.log("\n=====idTokemResult.claims\nisAdmin", isAdmin,"  |=> admin ",JSON.stringify(idTokenResult.claims.admin),"<=|");
                                                                                                 })
                                                                                                .catch((error) => {
                                                                                                    console.log("getIdTokenResult error: ", error);
                                                                                                });
                                                                                            console.log("\n========== in authstatechanged\nuser: ", user);
                                                                                            //addUserToDb(user);
                                                                                        }
                                                                                    });
                                                                                }}
                                                                        >
                                                                            <span className={"button-with-icon"}>Sign in with Google</span>&nbsp;&nbsp;
                                                                            <img alt={"Google"} height={"30px"}
                                                                                 src={require('./resources/google.png')}/>
                                                                        </button>
                                                                    </div>
                                                                    <div className={"button-with-icon"}>
                                                                        <button className="pal-button button-with-icon"
                                                                                onClick={async () => {
                                                                                    // setState({isLoading: true});
                                                                                    const provider = new firebase.auth.FacebookAuthProvider();
                                                                                    firebase.auth().signInWithPopup(provider).then(async function (result) {
                                                                                        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
                                                                                        // var token = result.credential.accessToken;
                                                                                        // The signed-in user info.
                                                                                        var user = result.user;
                                                                                        //console.log(" user ", user?.uid );
                                                                                        setState({
                                                                                            // isLoading: false,
                                                                                            currentAppUser: user
                                                                                        });
                                                                                    }).catch(function (error) {
                                                                                        // Handle Errors here.
                                                                                        var errorCode = error.code;
                                                                                        var errorMessage = error.message;
                                                                                        // The email of the user's account used.
                                                                                        var email = error.email;
                                                                                        // The firebase.auth.AuthCredential type that was used.
                                                                                        var credential = error.credential;

                                                                                        console.log("==== FB login error =====\n",
                                                                                            errorCode, "\n",
                                                                                            errorMessage, "\n",
                                                                                            email, "\n",
                                                                                            credential, "\n",
                                                                                            "==== =========== =====\n")
                                                                                        // ...
                                                                                    });

                                                                                    let callback: { (snapshot: any): void; (a: firebase.database.DataSnapshot, b?: string | null | undefined): any; } | null = null;
                                                                                    let metadataRef: firebase.database.Reference | null = null;
                                                                                    firebase.auth().onAuthStateChanged(async user => {
                                                                                        // Remove previous listener.
                                                                                        if (callback) {
                                                                                            metadataRef?.off('value', callback);
                                                                                        }
                                                                                        // On user login add new listener.
                                                                                        if (user) {
                                                                                            // Check if refresh is required.
                                                                                            metadataRef = firebase.database().ref('metadata/' + user.uid + '/refreshTime');
                                                                                            callback = (snapshot: any) => {
                                                                                                // Force refresh to pick up the latest custom claims changes.
                                                                                                // Note this is always triggered on first call. Further optimization could be
                                                                                                // added to avoid the initial trigger when the token is issued and already contains
                                                                                                // the latest claims.
                                                                                                // snapshot = snapshot;
                                                                                                 console.log("=====\nsnapshot: \n", snapshot);
                                                                                                user.getIdToken(true);
                                                                                            };
                                                                                            // Subscribe new listener to changes on that node.
                                                                                            metadataRef.on('value', callback);

                                                                                            let isAdmin = false;
                                                                                            await  user?.getIdTokenResult()
                                                                                                .then((idTokenResult) => {
                                                                                                    // Confirm the user is an Admin.
                                                                                                    isAdmin = !!idTokenResult.claims.admin;
                                                                                                    setState({
                                                                                                        currentUserIsAdmin: isAdmin,
                                                                                                    });
                                                                                                    console.log("\n=====idTokemResult.claims\nisAdmin", isAdmin,"  |=> admin ",JSON.stringify(idTokenResult.claims.admin),"<=|");
                                                                                                })
                                                                                                .catch((error) => {
                                                                                                    console.log("getIdTokenResult error: ", error);
                                                                                                });
                                                                                            console.log("\n========== in authstatechanged\nuser: ", user);
                                                                                             //addUserToDb(user);
                                                                                        }
                                                                                    });

                                                                                }}
                                                                        >
                                                                            <span className={"button-with-icon"}>Sign in with Facebook&nbsp;&nbsp;</span><img
                                                                            alt={"FB"} height={"25px"}
                                                                            src={require('./resources/facebook.jpeg')}/>
                                                                        </button>
                                                                    </div>
                                                                    {/*     Email/Password  (future)          */}
                                                                    {/*<button*/}
                                                                    {/*    onClick={async () => {*/}
                                                                    {/*        // setState({isLoading: true});*/}
                                                                    {/*        // const emailAuthProvider = new firebase.auth.EmailAuthProvider();*/}

                                                                    {/*        firebase.auth().signInWithEmailAndPassword("gpontecorvo@yahoo.com", "gr8fulDead252561").catch(function (error) {*/}
                                                                    {/*            console.log(error);*/}
                                                                    {/*        });*/}
                                                                    {/*        setState({*/}
                                                                    {/*            // isLoading: false,*/}
                                                                    {/*            currentUserUid: firebase.auth().currentUser?.uid*/}
                                                                    {/*        });*/}
                                                                    {/*    }}*/}
                                                                    {/*>*/}
                                                                    {/*    Sign in with email*/}
                                                                    {/*</button>*/}
                                                                </div>)
                                                        }}
                                                    </IfFirebaseUnAuthed>
                                                </div>)
                                        }}
                                    </FirebaseAuthProvider>
                                </div>
                            </React.Fragment>
                        )}
                </State>
            </div>
        </div>
    );
};

export default App;
