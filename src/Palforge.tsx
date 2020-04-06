import * as React from "react";
import {render} from "react-dom";
import './index.css';
import firebase from './firebase.js'
import {firestore} from "firebase";

// const firebase = require('firebase/app');
// require('firebase/<PACKAGE>');

// // ES Modules:
//     import firebase from 'firebase/app';
// import 'firebase/auth';
//
// // Typescript:
//     import * as firebase from 'firebase/app';

import "firebase/auth";
import {
    FirebaseAuthProvider,
    FirebaseAuthConsumer
} from "@react-firebase/auth";
import * as admin from "firebase-admin";
import DocumentData = admin.firestore.DocumentData;
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;

// import {config} from "firebase" ;//"./firebase.js";

var db = firebase.firestore();


const IDontCareAboutFirebaseAuth = () => {
    return <div>This part won't react to firebase auth changes</div>;
};


interface IColumnClickDisplayState {
    sortInfo: {
        sortCol: string;
        sortDesc: boolean;
    }
}

interface IColumnClickDisplayProps {
    handleSortOrder(name: string): any;

    columnId: string;
    headerText: string;
    markerClass: string;
}


class ColumnClickDisplay extends React.Component<IColumnClickDisplayProps, IColumnClickDisplayState> {
    constructor(props) {
        super(props);
        this.state = {
            sortInfo: {
                sortCol: "",
                sortDesc: false
            }
        }
    }

    // class names for direction indicator: these must exist in CSS
    ARROW_UP = "arrow-up";
    ARROW_DOWN = "arrow-down";
    SEEN = "seen";
    NOT_SEEN = "not-seen";
    OVERLAY = "overlay";
    ARROW_UP_CLASSES_INIT_NOT_SEEN = [this.ARROW_UP, this.NOT_SEEN, this.OVERLAY].join(" ");
    ARROW_DOWN_CLASSES_INIT_NOT_SEEN = [this.ARROW_DOWN, this.NOT_SEEN, this.OVERLAY].join(" ");
    ARROW_UP_CLASSES_INIT_SEEN = [this.ARROW_UP, this.SEEN, this.OVERLAY].join(" ");
    ARROW_DOWN_CLASSES_INIT_SEEN = [this.ARROW_DOWN, this.SEEN, this.OVERLAY].join(" ");

    handleSortOrder = (e) => {
        // ask the parent for sortInfo
        var sortInfo = this.props.handleSortOrder(e);
        this.displayTheArrows(sortInfo);
        this.setState({
            sortInfo: sortInfo
        });
    };

    componentDidMount(): void {
        // this.setState({
        //         sortInfo: {
        //             sortCol: "",
        //             sortDesc: false
        //         }
        //     }
        // )
    }

    displayTheArrows(sortInfo) {
        let allHeaderElements = document.getElementsByClassName(this.props.markerClass);

        Array.from(allHeaderElements)
            .forEach((theElement) => {
                var theClasses = theElement.classList.value.split(/\s+/);
                // console.log("\n------------\ntheClasses ", theClasses, " sortInfo ", sortInfo )
                if (theElement.parentElement.id == sortInfo.sortCol) {
                    if (theClasses.findIndex((aClass) => aClass == this.ARROW_UP) != -1) {
                        // console.log("here 1 - ArrowUp");
                        var visIndex = theClasses.findIndex((aClass) => aClass == (sortInfo.sortDesc ? this.NOT_SEEN: this.SEEN ));
                        if (visIndex != -1) {
                            // console.log("here 2");
                            theClasses[visIndex] = (sortInfo.sortDesc ? this.NOT_SEEN : this.SEEN);
                            theElement.classList.value = theClasses.join(" ");
                        }
                    } else if (theClasses.findIndex((aClass) => aClass == this.ARROW_DOWN) != -1) {
                        // console.log("here 3 - ArroDown");
                        var visIndex = theClasses.findIndex((aClass) => aClass == (!sortInfo.sortDesc ? this.SEEN : this.NOT_SEEN));
                        if (visIndex != -1) {
                            // console.log("here 4");
                            theClasses[visIndex] = (sortInfo.sortDesc ? this.SEEN : this.NOT_SEEN);
                            theElement.classList.value = theClasses.join(" ");
                        }
                    }
                } else {
                    // console.log("here 5");
                    var visIndex = theClasses.findIndex((aClass) => aClass == this.SEEN);
                    if (visIndex != -1) {
                        // console.log("here 6");
                        theClasses[visIndex] = this.NOT_SEEN;
                        theElement.classList.value = theClasses.join(" ");
                    }
                }

            });
    }

    render() {

        var sortInfo = this.state.sortInfo;
 //       console.log("sortinfo ", sortInfo);
        return (
            <th id={this.props.columnId} onClick={this.handleSortOrder.bind(this)}>
                {this.props.headerText}&nbsp;

                <span
                    className={((sortInfo.sortCol == this.props.columnId && !sortInfo.sortDesc) ? this.ARROW_UP_CLASSES_INIT_SEEN : this.ARROW_UP_CLASSES_INIT_NOT_SEEN) + " " + this.props.markerClass}/>
                <span
                    className={((sortInfo.sortCol == this.props.columnId && sortInfo.sortDesc) ? this.ARROW_DOWN_CLASSES_INIT_SEEN : this.ARROW_DOWN_CLASSES_INIT_NOT_SEEN) + " " + this.props.markerClass}/>
            </th>
        );
    }
}


/**
 * Component to accept input with button hooks to parent <Palindrome/> to:
 * reverse what's been typed
 * check if it's a palindrome
 * save text to storage
 * clear storage
 *
 * */
interface ITextInputState {
    text?: string;
    isPalindrome?: boolean;
}

interface ITextInputProps {
    onChange(name: string): any;

    checkPalindrome(name: string): any;

    reverseText(name: string): any;

    saveText(name: string): any;
}

class TextInput extends React.Component<ITextInputProps, ITextInputState> {
    constructor(props) {
        super(props);
        this.state = {
            text: "",
            isPalindrome: true,
        }
    }

    onChange = (e) => {
        const value = e.target.value;
        this.props.onChange(value);
        const isPal = this.props.checkPalindrome(value);
        this.setState(() => ({
            text: value,
            isPalindrome: isPal,
        }));

    };

    reverseText = () => {
        const flipped = this.props.reverseText(this.state.text);
        this.setState(() => ({
            text: flipped,
        }));
    };

    checkPalindrome = () => {
        return this.props.checkPalindrome(this.state.text);
    };

    saveText = () => {
        const saved = this.props.saveText(this.state.text);
        this.setState(() => ({
            text: saved,
        }));
    };

    render() {
        return (

            <div>
                <div>
                    <textarea className="palindrome-input" onChange={this.onChange.bind(this)}
                              value={this.state.text}/>
                </div>
                {
                    this.state.isPalindrome &&
                    <div className={"palindrome-status is-pal"}>
                        <span role="img" aria-label={"smiley"} className={"even-smaller"}>&#128540;</span> palindrome
                    </div>
                }
                {
                    !this.state.isPalindrome &&
                    <div className={"palindrome-status not-pal"}><span>not</span> palindrome </div>
                }
                <div>
                    <button className="pal-button" onClick={this.reverseText.bind(this)}>
                        Reverse input
                    </button>
                    <button className="pal-button" onClick={this.saveText.bind(this)}>
                        Save
                    </button>
                </div>
            </div>
        );
    }
}

interface IDbPalindrome {
    raw: string;
    cooked: string;
    id: string;
    selected: boolean;
    createTime: number;
    user: any;
}

interface IPalindromeState {
    palindrome: string;
    dbPalindromes: {
        palindromes: IDbPalindrome[];
    };
    palfilter: string;
    allNone: boolean;
    sortInfo: {
        sortCol: string;
        sortDesc: boolean;
    }

}

interface IPalindromeProps {
}

/**
 * Component to create palindromes, with visual aids to
 * assist the process and store results and clear stored
 * reverse what's been typed
 * check if it's a palindrome
 * save text to storage
 * clear storage
 *
 * */
class Palindrome extends React.Component<IPalindromeProps, IPalindromeState> {
    constructor(props) {
        super(props);
        this.state = {
            palindrome: "",
            dbPalindromes: {"palindromes": []},
            palfilter: "all",
            allNone: false,
            sortInfo: {
                sortCol: "",
                sortDesc: false
            }
        }
    }

    componentDidMount() {
        this.reloadFromDb();
        // this.setState({
        //     sortInfo: this.props.initialSort.sortInfo
        // });
// Start listing users from the beginning, 1000 at a time.
        //this.listAllUsers(null);
    }

    // listAllUsers(nextPageToken) {
    //     // List batch of users, 1000 at a time.
    //     admin.auth().listUsers(1000, nextPageToken)
    //         .then(function(listUsersResult) {
    //             listUsersResult.users.forEach(function(userRecord) {
    //                 console.log('user', userRecord.toJSON());
    //             });
    //             if (listUsersResult.pageToken) {
    //                 // List next batch of users.
    //                 this.listAllUsers(listUsersResult.pageToken);
    //             }
    //         })
    //         .catch(function(error) {
    //             console.log('Error listing users:', error);
    //         });
    // }


    reloadFromDb() {
        var thePalindromes = {"palindromes": []};
        db.collection("/palindromes").get().then((querySnapshot) => {
//                console.log("querySnapShot " + JSON.stringify(querySnapshot));
            querySnapshot.forEach((doc) => {
                //console.log(JSON.stringify(doc.data()));
                var theRaw = `${doc.data().raw}`;
                var theCooked = `${doc.data().cooked}`;
                var theUser = `${doc.data().user}`;
                if (theUser.startsWith("{")) {
                    theUser = JSON.parse(theUser).uid;
                }
                var theId = `${doc.id}`;
                var theCreateTime = new Date(1000 * Number(`${doc.data().createTime.seconds}`));
                thePalindromes.palindromes.push({
                    "raw": theRaw,
                    "cooked": theCooked,
                    id: theId,
                    selected: false,
                    createTime: theCreateTime,
                    user: theUser
                });
            });
            // console.log("After querySnap.forEach: " + JSON.stringify(thePalindromes.palindromes));
            this.setState({
                dbPalindromes: thePalindromes
            });
        });
        return thePalindromes;
    }

    //console.log("byId? " + JSON.stringify(thePalindromes.palindromes.filter(obj => obj.id === "0OMgK4Bd5cFLa8pw5O4m")));

    onChange = (value) => {
        this.setState(() => ({
            palindrome: value,
        }));
    };

    reverseText = (str) => {
        const flipped = this.reverseString(str);
        this.setState(() => ({
            palindrome: flipped,
        }));
        return flipped;
    };

    checkPalindrome = (str) => {
        return this.isPalindrome(str);
    };

    saveText = (str) => {
        if (!str) {
            return "";
        }

        this.addToDb(str);
        this.reloadFromDb();
        return str;
    };

    deleteSelected = () => {
        console.log("clicked");
        var selected = this.state.dbPalindromes.palindromes.filter(pal => pal.selected);
        selected.map(pal => {
            this.deleteDocument(pal);
            return pal;
        });
        this.reloadFromDb();
    };

    deleteDocument = (pal) => {
        db.collection("/palindromes").doc(pal.id).delete().then(function () {
            console.log("Palindrome successfully deleted " + JSON.stringify(pal));
        }).catch(function (error) {
            console.error("Error removing document: ", error);
        });
    };

    addToDb = (str) => {
        var userJSON = firebase.auth().currentUser.toJSON();
        db.collection("palindromes").add({
            raw: str,
            cooked: this.normalizeString(str),
            createTime: firestore.Timestamp.fromDate(new Date()),
            user: JSON.stringify(Object.keys(userJSON).reduce((obj, key) => {
                    if (["uid","displayName", "photoURL"].includes(key) ) {
                        obj[key] = userJSON[key];
                    }
                    return obj;
                }, {}
            )),
        })
            .then(function (docRef) {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });
/*
*
const newCar = Object.keys(car).reduce((object, key) => {
  if ([] ]) {
    object[key] = car[key]
  }
  return object
}, {})
* */
    };

    evaluatePalFilter = (str) => {
        switch (this.state.palfilter) {
            case "onlypals":
                return this.isPalindrome(str);
            case "notpals":
                return !this.isPalindrome(str);
            case "all":
            default:
                return true;
        }
    };

    handleChecked = (event) => {
        var docId = event.target.value;
        var thePalindromes = this.state.dbPalindromes.palindromes.slice();
        var position = thePalindromes.findIndex(function (element, index, array) {
            return element.id === docId
        });

        thePalindromes[position].selected = !thePalindromes[position].selected;

//        console.log("item : " + JSON.stringify(thePalindromes[position]));
        this.setState({
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    handleSortOrder = (event) => {
        let headerId = event.target.id;
        let direction = this.state.sortInfo.sortDesc;
        if (this.state.sortInfo.sortCol === headerId) {
            direction = !direction;
        }

        var sortInfo = {
            sortCol: headerId,
            sortDesc: direction
        };
        this.setState({
            sortInfo: sortInfo
        });
        return sortInfo;
    };

    handleAllNoneChecked = (event) => {
        var isSelected = !this.state.allNone;
        var thePalindromes = this.state.dbPalindromes.palindromes.slice();
        thePalindromes.map((item) => item.selected = isSelected);
        this.setState({
            dbPalindromes: {palindromes: thePalindromes},
            allNone: isSelected
        });
    };

    handleOptionChange = event => {

        this.setState({
            palfilter: event.target.value
        });
    };

    render() {

        let haveInput = this.state.palindrome.length > 0;
        let smoothedParts = this.smooth(this.state.palindrome);
        let smoothHtml = [];
        smoothHtml.push(<span>{smoothedParts[0]}</span>,
            <span className="midpoint">{smoothedParts[1]}</span>,
            <span>{smoothedParts[2]}</span>);

        return (
            <div>
                <div>Enter text to create a palindrome:</div>
                <div
                    className={"input-area section-border"}>
                    {/*bind methods for the child */}
                    <TextInput
                        onChange={this.onChange.bind(this)}
                        reverseText={this.reverseText.bind(this)}
                        saveText={this.saveText.bind(this)}
                        // clearSaved={this.clearSaved.bind(this)}
                        checkPalindrome={this.checkPalindrome.bind(this)}
                    />
                </div>
                {haveInput &&
                <div>
                    <div>Input as typed:</div>
                    <div
                        className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>{this.state.palindrome} </div>
                    <div>Reversed input: (Turnaround is <strong>{smoothedParts[1]}</strong>)</div>
                    <div
                        className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>{smoothHtml}</div>
                </div>}

                <div>
                    <div>
                        <div>DB palindromes:</div>
                    </div>
                    <div className={"indent"}>
                        <div className="radio-button">
                            <label>
                                <input
                                    type="radio"
                                    name="palfilter"
                                    value="all"
                                    checked={this.state.palfilter === "all"}
                                    onChange={this.handleOptionChange}
                                    className=""
                                />
                                All
                            </label>
                        </div>
                        <div className="radio-button">
                            <label>
                                <input
                                    type="radio"
                                    name="palfilter"
                                    value="onlypals"
                                    checked={this.state.palfilter === "onlypals"}
                                    onChange={this.handleOptionChange}
                                    className=""
                                />
                                Only Palindromes
                            </label>
                        </div>
                        <div className="radio-button">
                            <label>
                                <input
                                    type="radio"
                                    name="palfilter"
                                    value="notpals"
                                    checked={this.state.palfilter === "notpals"}
                                    onChange={this.handleOptionChange}
                                    className=""
                                />
                                Only Non-palindromes
                            </label>
                        </div>
                        <button className="pal-button"
                                onClick={ this.deleteSelected }
                                disabled={ firebase.auth().currentUser.isAnonymous || this.state.dbPalindromes.palindromes.filter(pal => pal.selected).length == 0 }
                        >
                            Delete Selected
                        </button>

                    </div>
                    <div className="indent">
                        <table className={"list section-border"}>
                            <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        name="allNone"
                                        checked={this.state.allNone}
                                        onChange={this.handleAllNoneChecked}
                                        value={"value"}
                                        className={"checkbox"}
                                    />

                                </th>

                                <ColumnClickDisplay
                                    handleSortOrder={this.handleSortOrder}
                                    columnId={"entryColumn"}
                                    headerText={"Entry"}
                                    markerClass={"palListSorter"}
                                />
                                <ColumnClickDisplay
                                    handleSortOrder={this.handleSortOrder}
                                    columnId={"createdColumn"}
                                    headerText={"Created"}
                                    markerClass={"palListSorter"}
                                />
                                <ColumnClickDisplay
                                    handleSortOrder={this.handleSortOrder}
                                    columnId={"uidColumn"}
                                    headerText={"User UID"}
                                    markerClass={"palListSorter"}
                                />
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.dbPalindromes.palindromes
                                .filter(pal => this.evaluatePalFilter(pal.raw))
                                .slice().sort((a, b) => this.comparePals(a, b))
                                .map((item, key) =>
                                    <tr key={key}>
                                        <td>
                                            {!firebase.auth().currentUser.isAnonymous && <input
                                                type="checkbox"
                                                name="listitems"
                                                checked={item.selected}
                                                onChange={this.handleChecked}
                                                value={item.id}
                                                className={"checkbox"}
                                            />}
                                        </td>
                                        <td className={"list-item no-margin " + this.palindromeClass(item.raw)}>
                                            {item.raw}
                                        </td>
                                        <td>
                                            {item.createTime.toLocaleString()}
                                        </td>
                                        <td>
                                            {typeof item.user === "string" ? item.user : item.user.uid}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        );
    }

    comparePals = (a, b) => {
        switch (this.state.sortInfo.sortCol) {
            case "createdColumn":
                return this.state.sortInfo.sortDesc ? b.createTime - a.createTime : a.createTime - b.createTime;
            case "entryColumn":
                return this.state.sortInfo.sortDesc ? b.raw.localeCompare(a.raw) : a.raw.localeCompare(b.raw);
            case "uidColumn":
                return this.state.sortInfo.sortDesc ? b.user.localeCompare(a.user) : a.user.localeCompare(b.user);
            default:
                return 0;
        }
    };

    reverseString(str) {
        return str.split("").reverse().join("");
    }

    /** Removes whitespace, punctuation and diacriticals, then formats with one space between uppercase characters
     * I have found this to be the easiest format for the eye to pick up on word patterns.
     * */
    normalizeString(str) {
        return this.stripWhiteSpace(this.stripPunctuation(this.stripDiacriticals(str))).toUpperCase()
            .split("").join(" ");
    }

    /**
     * Strips all diacriticals (accented or decorated characters) by separating the parts, and removing the non-alphanumeric.
     * TODO: Known issues - "ß" which ends up as "ss" not "s" and æ which ends up as "ae" and perhaps some other similar
     *
     * */
    stripDiacriticals(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    /**
     * Strips all puncutation
     * It's a fairly exhaustive regex I found on the web so it must be correct :)
     *
     * */
    stripPunctuation(str) {
        return str.replace(
            /[!-/:-@[-`{-~¡-©«-¬®-±´¶-¸»¿×÷˂-˅˒-˟˥-˫˭˯-˿͵;΄-΅·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿᾽᾿-῁῍-῏῝-῟῭-`´-῾\u2000-\u206e⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-\u2e7e⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〿゛-゜゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꜀-꜖꜠-꜡꞉-꞊꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-｀｛-･￠-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g,
            "");
    }

    /**
     * Strips all white space
     * */
    stripWhiteSpace(str) {
        return str.replace(/\s/g, "");
    }

    /**
     * Checks if str is a plindrome by normalizing it and comparing to its reverse
     * */
    isPalindrome(str) {
        var normal = this.normalizeString(str);
        return normal === this.reverseString(normal);
    }


    /** Does the following:
     * 1. normailize (emoves whitespace, punctuation and diacriticals, then formats with one space between uppercase characters
     * I have found this to be the easiest format for the eye to pick up on word patterns.
     * 2. revese string
     * 3. return array with three strings: before the midpoint, the midpoint or turnaround string, after the midpoint
     * */
    smooth(str) {
        var smooth = this.reverseString(this.normalizeString(str));
        var nChars = (smooth.length + 1) / 2;
        var turnaroundSize = ((nChars % 2) === 0 ? 4 : 3);
        var parts = [];
        parts.push(smooth.substring(0, nChars - turnaroundSize));
        parts.push(smooth.substring(nChars - turnaroundSize, (nChars - turnaroundSize) + turnaroundSize * 2));
        parts.push(smooth.substring((nChars - turnaroundSize) + turnaroundSize * 2));

        return parts;
    }

    /**
     *  convenience method to return different  color class names for palindrome vs. nonpalindrome
     *  Slightly klugey
     *  TODO: separate concerns better
     * @returns {string | representing the color class to use for formatting}
     */
    palindromeClass(str) {
        return str ? (this.isPalindrome(str) ? "is-pal" : "not-pal") : "";
    }
}


/**
 * Main cllass to contain the working part(s)
 */
class Palforge extends React.Component {
    render() {
        // let initialSort = {
        //     sortInfo: {
        //         sortCol: "entryColumn",
        //         sortDesc: false
        //     }
        // };
        return (
            <div>
                <div>
                    <div className="palforge">
                        <Palindrome
                            // initialSort={initialSort
                            // }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

// ========================================
export default Palforge;

// @ts-ignore
// ReactDOM.render(
//     <Palforge/>,
//     document.getElementById('root')
// );
