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
import User from "firebase";

const APP_TITLE = "The Palindrome Forge";
const THE_ADMINS_EMAIL = "gpontecorvo@gmail.com";

const NO_USER = {
    "isAdmin": false,
    "isAnonymous": true,
    "createdAt": 0,
    "displayName": "theDisplayName"
}

const displayUserInfo = (profile: firebase.UserInfo | null, isAnonymous: boolean) => {
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

const userColumns = ["uid", "displayName", "isAnonymous", "email"];

const addUserToDb = (user: User.User) => {
    const userJSON: any = user.toJSON();
    const theJson = Object.keys(userJSON).reduce((obj: any, key) => {
        if (userColumns.includes(key)) {
            obj[key] = userJSON[key];
        }
        return obj;
    }, {});

    let theIsAdmin = theJson.email === THE_ADMINS_EMAIL;
    console.log("addingUsertoDB:\n", JSON.stringify(theJson), " theIsAdmin ", theIsAdmin);

    let db = firebase.firestore();
    db.collection("users").doc(theJson.uid).set({
        displayName: theJson.displayName,
        isAnonymous: theJson.isAnonymous,
        email: theJson.email,
        isAdmin: theIsAdmin
    }, {merge: true}).then(function () {
        console.log("Document for ", theJson.displayName, " successfully merged to \"users\" collection");

    }).catch(function (error) {
        console.error("Error writing document: ", error);
    });
};

const getAppUser = async (uid: string): Promise<any> => {

    let db = firebase.firestore();
    var docRef = db.collection("users").doc(uid);
    var result: any;
    await docRef.get().then(function (doc) {
        if (doc.exists) {

            var theIsAdmin = String(`${doc.data()!.isAdmin}`) === "true";
            var theCreatedAt = new Date(Number(`${doc.data()!.createdAt}`));
            var theDisplayName = `${doc.data()!.displayName}`;
            var theIsAnonymous = String(`${doc.data()!.isAnonymous}`) === "true";
            var theDoc = {
                "isAdmin": theIsAdmin,
                "isAnonymous": theIsAnonymous,
                "createdAt": theCreatedAt,
                "displayName": theDisplayName
            }
            // console.log("in getAppUser theDoc: ", theDoc);
            result = theDoc;
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document for uid \"", uid, "\"");
        }
    }).catch(function (error) {
        console.log("Error getting document:", error);
    }).finally(function () {

    });
    return result;
};


/*
function () {
        console.log("Document for ", theJson.displayName, " successfully merged to \"users\" collection");

    }
 */


firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        addUserToDb(user);
    } else {
        console.log(
            "User is signed out "
        )
    }
});

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
                        currentAppUser: NO_USER,
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
                                    <div>{` state: ${JSON.stringify(state.currentAppUser)}`}</div>
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
                                                        {() => {
                                                            var isAnonymous = typeof firebase.auth().currentUser?.isAnonymous == "undefined" ?
                                                                false : firebase.auth().currentUser!.isAnonymous
                                                            if (state.currentAppUser === NO_USER) {
                                                                let currUser: any = {};
                                                                getAppUser(firebase.auth().currentUser!.uid).then(function (result) {
                                                                    currUser = result;
                                                                    setState({
                                                                        // isLoading: false,
                                                                        currentAppUser: currUser ? currUser : NO_USER
                                                                    });
                                                                });
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
                                                                                            currentAppUser: NO_USER
                                                                                        });
                                                                                    }}
                                                                            >
                                                                                Sign out
                                                                            </button>

                                                                        </div>
                                                                    </div>
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
                                                                    {state.currentAppUser && state.currentAppUser.isAdmin &&

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
                                                                            adminMode={state.adminMode && state.currentAppUser.isAdmin}/>
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
                                                                                        let currUser: any = {};
                                                                                        await getAppUser(user!.uid).then(function (result) {
                                                                                            currUser = result;
                                                                                            console.log("in login click curruser then ", currUser);
                                                                                        });
                                                                                        console.log("in login click curruser after then ", currUser);


                                                                                        setState({
                                                                                            // isLoading: false,
                                                                                            currentAppUser: currUser ? currUser : NO_USER
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
                                                                                        let currUser = null;
                                                                                        await getAppUser(user!.uid).then(function (result) {
                                                                                            currUser = result;
                                                                                            console.log("in login click curruser then ", currUser);
                                                                                        });
                                                                                        console.log("in login click curruser after then ", currUser);
                                                                                        setState({
                                                                                            // isLoading: false,
                                                                                            currentAppUser: currUser ? currUser : NO_USER
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
