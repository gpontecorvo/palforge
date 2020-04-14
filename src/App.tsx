import * as React from "react";
import Palforge from "./Palforge"
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
import User from "firebase";
import {privacypolicy} from "./privacypolicy";
import Popup from "./Popup";

const APP_TITLE = "The Palindrome Forge";

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

const userColumns = ["uid", "displayName", "photoURL", "email", "emailVerified", "phoneNumber",
    "isAnonymous", "providerData", "lastLoginAt", "createdAt"];


const addUserToDb = (user: User.User) => {
    const userJSON: any = user.toJSON();
    const theJson = Object.keys(userJSON).reduce((obj: any, key) => {
        if (userColumns.includes(key)) {
            obj[key] = userJSON[key];
        }
        return obj;
    }, {});

    // console.log("addingUsertoDB:\n", JSON.stringify(theJson));

    let db = firebase.firestore();
    db.collection("users").doc(theJson.uid).set({
        displayName: theJson.displayName,
        photoURL: theJson.photoURL,
        email: theJson.email,
        emailVerified: theJson.emailVerified,
        phoneNumber: theJson.phoneNumber,
        isAnonymous: theJson.isAnonymous,
        providerData: theJson.providerData && theJson.providerData[0] ? theJson.providerData![0].providerId : "",
        lastLoginAt: theJson.lastLoginAt,
        createdAt: theJson.createdAt,
        isAdmin: false
    }, {merge: true}).then(function () {
        console.log("Document for ", theJson.displayName, " successfully merged to \"users\" collection");
    }).catch(function (error) {
        console.error("Error writing document: ", error);
    });
};

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        addUserToDb(user);
    } else {
        console.log(
            "User is signed out "
        )
        //removeAnonymousData();
        // setState({
        //     currentUserUid: "none"
        // });
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
                        currentUserUid: "",
                        privacypolicyshown: false,
                        showPopup: false
                    }
                }>
                    {({state, setState}) => (
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
                                                <span className={"right-just"}>
                                                    <a href="#" onClick={() => {
                                                        let shown = !state.showPopup;
                                                        setState({
                                                            showPopup: shown
                                                        });
                                                    }}><span className={"even-smaller"}>Show Privacy Policy</span>
                                                    </a>
                                                    {
                                                        state.showPopup &&
                                                        <Popup
                                                            html={privacypolicy()}
                                                            buttonText={"Hide Privacy Policy"}
                                                            closePopup={() => {
                                                                let shown = !state.showPopup;
                                                                setState({
                                                                    showPopup: shown
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
                                                        // console.log (JSON.stringify(firebase.auth().currentUser));

                                                        var isAnonymous = typeof firebase.auth().currentUser?.isAnonymous == "undefined" ?
                                                            false : firebase.auth().currentUser!.isAnonymous
                                                        // console.log("authed \n", JSON.stringify(firebase.auth().currentUser)); // ? false : firebase.auth().currentUser!.isAnonymous;

                                                        return (
                                                            <div>
                                                                <div className={"left-just"}>
                                                                    {/*<h5>Signed in as:</h5>*/}
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
                                                                                        currentUserUid: ""
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

                                                                <div className={"clear-float clearfix"}></div>
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
                                                                                firebase.auth().signInWithPopup(googleAuthProvider);
                                                                                setState({
                                                                                    // isLoading: false,
                                                                                    currentUserUid: firebase.auth().currentUser?.uid
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
                                                                                firebase.auth().signInWithPopup(provider).then(function (result) {
                                                                                    // This gives you a Facebook Access Token. You can use it to access the Facebook API.
                                                                                    // var token = result.credential.accessToken;
                                                                                    // The signed-in user info.
                                                                                    var user = result.user;
                                                                                    setState({
                                                                                        // isLoading: false,
                                                                                        currentUserUid: user!.uid
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
