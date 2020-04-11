import * as React from "react";
import {render} from "react-dom";
import Palforge from "./Palforge"

import {
    FirebaseAuthProvider,
    IfFirebaseAuthed,
    IfFirebaseUnAuthed
} from "@react-firebase/auth";

// import firebase from './firebase.js'
import * as firebase from "firebase/app";
import {config} from "./firebase";
import {State} from "react-powerplug";
import User from "firebase";
import {privacypolicy} from "./privacypolicy";

//require privacypolicy;

// import firebaseHelper from "firebase-functions-helper";



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


const addUserToDb = (user: User.User) => {
    const userJSON: any = user.toJSON();
    const theJson = Object.keys(userJSON).reduce((obj: any, key) => {
        if (userColumns.includes(key)) {
            obj[key] = userJSON[key];
        }
        return obj;
    }, {});

    console.log("addingUsertoDB:\n", JSON.stringify(theJson));

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
        console.log("Document successfully written to \"users\" collection");
    }).catch(function (error) {
        console.error("Error writing document: ", error);
    });
};

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        addUserToDb(user);
        // setState({
        //     //isLoading: false,
        //     currentUserUid: user.uid
        // });

    } else {
        // removeAnonymousUsersandData();

        console.log(
            "User is signed out "// , state.currentUserUid
        )
        //removeAnonymousData();
        // setState({
        //     //isLoading: false,
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


const App = () => {
    // until prompt for user pass word
    // firebase.auth().createUserWithEmailAndPassword("gpontecorvo@yahoo.com", "***********").catch(function(error) {
    //     console.log(error);
    // });

    return (
        <div>
            <div>
                <State initial={
                    {
                        // isLoading: false,
                        currentUserUid: "init",
                        privacypolicyshown: false
                    }
                }>
                    {({state, setState}) => (
                        <React.Fragment>
                            <div>
                                <h3>The Palindrome Forge<br/>
                                    <span
                                        className={"even-smaller"}>&copy;2020 Greg Pontecorvo. All rites observed.</span>
                                </h3>

                                <h5>{state.currentUserUid}</h5>
                                <button
                                    onClick={async () => {
                                        let shown= !state.privacypolicyshown;
                                         setState({
                                             privacypolicyshown: shown
                                        });
                                    }}
                                >
                                    {(state.privacypolicyshown ? "Hide" : "Show") + " privacy policy"}
                                </button>

                                <div className={state.privacypolicyshown ? "seen" : "not-seen"}>{privacypolicy()}</div>

                            </div>
                            <FirebaseAuthProvider {...config} firebase={firebase}>
                                {() => {
                                    return (
                                        <div>
                                            <IfFirebaseAuthed>
                                                {() => {
                                                    // console.log (JSON.stringify(firebase.auth().currentUser));

                                                    var isAnonymous = typeof firebase.auth().currentUser?.isAnonymous == "undefined" ?
                                                        false : firebase.auth().currentUser!.isAnonymous
                                                    console.log("authed \n", JSON.stringify(firebase.auth().currentUser)); // ? false : firebase.auth().currentUser!.isAnonymous;

                                                    return (
                                                        <div>
                                                            <h5>Signed in <span role="img"
                                                                                aria-label="weird emoji">🎉 </span></h5>
                                                            {/*<div>{state.isLoading ? "Loading . . . " : "Loaded"}</div>*/}
                                                            <div>Current User Id {state.currentUserUid}</div>
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

                                                            <button
                                                                onClick={async () => {
                                                                    // setState({isLoading: true});
                                                                    // var prevUserId = state.currentUserUid;
                                                                    // console.log("in signout onclick ", prevUserId);
                                                                    await firebase.auth().signOut();
                                                                    // removeAnonymousData(prevUserId);
                                                                    setState({
                                                                        // isLoading: false,
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
                                                            <button
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
                                                                Sign in with Google
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    // setState({isLoading: true});
                                                                    const provider = new firebase.auth.FacebookAuthProvider();
                                                                    firebase.auth().signInWithPopup(provider).then(function(result) {
                                                                        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
                                                                        // var token = result.credential.accessToken;
                                                                        // The signed-in user info.
                                                                        var user = result.user;
                                                                        setState({
                                                                            // isLoading: false,
                                                                            currentUserUid: user!.uid
                                                                        });
                                                                    }).catch(function(error) {
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
                                                                Sign in with Fscebook
                                                            </button>
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
                        </React.Fragment>
                    )}
                </State>
            </div>
        </div>
    );
};


render(<App/>, document.getElementById("root"));