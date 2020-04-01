import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import firebase from './firebase.js'
import {firestore} from "firebase";

// import * as firebase from 'firebase/app';
// import 'firebase/firestore';


// import firebase from 'firebase/app';
// import 'firebase/firestore';



// const firebase = require('firebase/app');
// require('firebase/firestore');


//import {Timestamp} from "@firebase/firestore/dist/src/api/timestamp"; // <------  import firebase

// import app from 'firebase/app';
// import 'firebase/auth';
//import 'firebase/firestore';

// import 'firebase/messaging';
// import { rootCollection, field, timestamp, Entity, ITimestamp } from 'firebase-firestorm';
// import * as firestorm from 'firebase-firestorm';
// import 'reflect-metadata';



// import { rootCollection, field, timestamp, Entity, ITimestamp } from 'firebase-firestorm';

var db = firebase.firestore();

/**
 * Component to accept input with button hooks to parent <Palindrome/> to:
 * reverse what's been typed
 * check if it's a palindrome
 * save text to storage
 * clear storage
 *
 * */
class TextInput extends React.Component {
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
        this.setState( () => ({
            text: value,
            isPalindrome: isPal,
        }));

    }

    reverseText = () => {
        const flipped = this.props.reverseText(this.state.text);
        this.setState( () => ({
            text: flipped,
        }));
    }

    checkPalindrome = () => {
        return this.props.checkPalindrome(this.state.text);
     }

    saveText = () => {
        const saved = this.props.saveText(this.state.text);
        this.setState( () => ({
            text: saved,
        }));
    }

    clearSaved = () => {
        const saveText = this.state.text;
        this.props.clearSaved();
        this.setState( () => ({
            text: saveText,
        }));
    }

    render() {
        return (

            <div>
                <div>
                    <textarea  className="palindrome-input" onChange={this.onChange.bind(this)}
                               value  = {this.state.text} />
                </div>
                {this.state.isPalindrome &&
                <div className={"palindrome-status is-pal"}><span role="img" aria-label={"smiley"} className={"even-smaller"}>&#128540;</span> palindrome </div>}
                {!this.state.isPalindrome &&
                <div className={"palindrome-status not-pal"}><span>not</span> palindrome </div>}
                <div>
                    <button className="pal-button" onClick = {this.reverseText.bind(this)} >
                        Reverse input
                    </button>
                    <button className="pal-button" onClick = {this.saveText.bind(this)} >
                        Save
                    </button>
                    <button className="pal-button" onClick = {this.clearSaved.bind(this)} >
                        Clear saved
                    </button>
                </div>
            </div>

        );
    }
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
class Palindrome extends React.Component {
    constructor(props) {
        super(props);
        const loaded = this.load();
        this.state = {
            palindrome: "",
            savedPalsString: !loaded ? "" : loaded,
            savedPals: !loaded ? [] : JSON.parse(loaded),
            dbPalindromes: {"palindromes" : []},
            palfilter: "all",
            allNone: false
        }
     }

    componentDidMount() {
        this.reloadFromDb();


     }

    reloadFromDb() {
        var thePalindromes = {"palindromes": []};
        db.collection("/palindromes").get().then((querySnapshot) => {
//                console.log("querySnapShot " + JSON.stringify(querySnapshot));
            querySnapshot.forEach((doc) => {
                var theRaw = `${doc.data().raw}`;
                var theCooked = `${doc.data().cooked}`;
                var theId = `${doc.id}`;
                var theCreateTime = new Date(`${doc.data().createTime.seconds}`*1000);
                thePalindromes.palindromes.push({
                    "raw": theRaw,
                    "cooked": theCooked,
                    id: theId,
                    selected: false,
                    createTime: theCreateTime
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
        this.setState( () => ({
            palindrome: value,
        }));
    }
    reverseText = (str) => {

        const flipped = this.reverseString(str);
        this.setState( () => ({
            palindrome: flipped,
        }));
        return flipped;
    }
    checkPalindrome = (str) => {
        return this.isPalindrome(str);
    }

    saveText = (str) => {
        if (!str) {
            return "";
        }

        const saveStr = str;
        let savedCopy = this.state.savedPals.slice();
        savedCopy.push({"key" : Date.now(), "pal":  saveStr});
        let saveString = JSON.stringify(savedCopy);
        this.setState( () => ({
            savedPals: savedCopy,
            savedPalsString: saveString,
        }));

        this.persist(saveString);
        this.addToDb(str);
        this.reloadFromDb();
        return str;
    }

    deleteSelected = () => {
        var selected = this.state.dbPalindromes.palindromes.filter(pal => pal.selected);
       selected.map(pal => {
           this.deleteDocument(pal);
           return pal;
       });
       this.reloadFromDb();
    };

    deleteDocument = (pal) => {
            db.collection("/palindromes").doc(pal.id).delete().then(function() {
            console.log("Palindrome successfully deleted " + JSON.stringify(pal));
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
    }

    addToDb = (str) => {
        db.collection("palindromes").add({
            raw: str,
            cooked: this.normalizeString(str),
            createTime: firestore.Timestamp.fromDate(new Date())
        })
            .then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch(function(error) {
                console.error("Error adding document: ", error);
            });

    }

        clearSaved = () => {
        this.setState( () => ({
            savedPals: [],
            savedPalsString: "",
        }));
        this.persist("");
    }

    evaluatePalFilter = (str) => {
        switch (this.state.palfilter) {
            case "all":
                return true;
            case "onlypals":
                return this.isPalindrome(str);
            case "notpals":
                return !this.isPalindrome(str);
            default:
                return true;
        }
    };


    handleChecked = (event) => {
        var docId = event.target.value;
        var thePalindromes = this.state.dbPalindromes.palindromes.slice();
        var position = thePalindromes.findIndex(function(element, index, array) {
            return element.id === docId
        });

        thePalindromes[position].selected = !thePalindromes[position].selected;
//        console.log("item : " + JSON.stringify(thePalindromes[position]));
        this.setState({
            dbPalindromes: {palindromes: thePalindromes}
        });
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
        smoothHtml.push(<span key={Date.now()}>{smoothedParts[0]}</span>,
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
                        clearSaved={this.clearSaved.bind(this)}
                        checkPalindrome={this.checkPalindrome.bind(this)}
                    />
                </div>
                {haveInput &&
                <div>
                    <div>Input as typed:</div>
                    <div className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>{this.state.palindrome} </div>
                    <div>Reversed input: (Turnaround is <strong>{smoothedParts[1]}</strong>)</div>
                    <div className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>{smoothHtml}</div>
                </div>}

                    {this.state.savedPals.length > 0 &&
                    <div>
                        <div>Saved Palindromes</div>
                        <div className="indent">

                            <ol className={"list section-border"}>
                                {this.state.savedPals.map((item, key) =>
                                    <li className={"list-item " + this.palindromeClass(item.pal) } key={item.key}>{item.pal}</li>)}

                            </ol>
                        </div>
                    </div>}
                <div>
                    <div>
                        <div>DB palindromes:</div>
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
                                <th>Entry</th>
                                <th>Created</th>
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.dbPalindromes.palindromes
                                .filter(pal => this.evaluatePalFilter(pal.raw))
                                .slice().sort((a, b) => this.comparePals(a, b))
                                .map((item, key) =>
                                    <tr key={key}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                name="listitems"
                                                checked={item.selected}
                                                onChange={this.handleChecked}
                                                value={item.id}
                                                className={"checkbox"}
                                            />
                                        </td>
                                        <td className={"list-item no-margin " + this.palindromeClass(item.raw)}>
                                            <span>{item.raw}</span>
                                        </td>
                                        <td>
                                            <span>{item.createTime.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div>
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
                        <button className="pal-button" onClick = {this.deleteSelected} >
                            Delete Selected
                        </button>

                    </div>
                </div>
            </div>
        );
    }


    comparePals  = ( a, b) => {
        return b.createTime - a.createTime;
    }

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
    smooth (str) {
        var smooth = this.reverseString(this.normalizeString(str));
        var nChars = (smooth.length+1)/2;
        var turnaroundSize = ((nChars % 2) === 0 ? 4 : 3);
        var parts = [];
        parts.push(smooth.substring(0, nChars - turnaroundSize ));
        parts.push(smooth.substring(nChars - turnaroundSize , (nChars - turnaroundSize) + turnaroundSize*2 ));
        parts.push(smooth.substring((nChars - turnaroundSize) + turnaroundSize*2 ));

        return parts;
    }

    /**
     *  convenience method to return different  color class names for palindrome vs. nonpalindrome
     *  Slightly klugey
     *  TODO: separate concerns better
     * @returns {string | representing the color class to use for formatting}
     */
    palindromeClass (str) {
        return str ? (this.isPalindrome(str) ? "is-pal" : "not-pal") : "";
    }

    /**
     * hook for persistence
     * TODO: change to use real database instead of localStorage
     * @returns {string | string}
     */
    load = () => {
        return localStorage.getItem("savedPals") || "";
    }

    /**
     * hook for persistence
     * TODO: change to use real database instead of localStorage
     * @returns {string | string}
     */    persist = (str) => {
        return localStorage.setItem("savedPals", str);
    }
}


/**
 * Main cllass to contain the working part(s)
 */
class Palforge extends React.Component {
    // constructor(props) {
    //     super(props);
    // }

    render() {

        return (
            <div>
                <div>
                    <h3>The Palindrome Forge<br/>

                    <span className={"emoji even-smaller"} role="img" aria-label={"copyright"}>
                            &copy;2020 Greg Pontecorvo. All rites observed.</span> </h3>
                </div>
                <div className="palforge">
                    <Palindrome/>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
    <Palforge/>,
    document.getElementById('root')
);
