import * as React from "react";
import './index.css';
import firebase from "./firebase";
import {firestore} from "firebase";
import "firebase/auth";

import TextInput from "./TextInput";
import ColumnClickDisplay, {IColumnClickDisplayState} from "./ColumnClickDisplay";

const db = firebase.firestore();

enum PalFilterType {
    ALL = " ALL",
    ONLY_PALINDROMES = "ONLY_PALINDROMES",
    NOT_PALINDROMES = "NOT_PALINDROMES",
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
    palfilters: {
        palFilterType: PalFilterType;
        onlyMine: boolean;
        textFilter: string;
    }
    allNone: boolean;
    columnState: IColumnClickDisplayState
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
    constructor(props: any) {
        super(props);
        this.state = {
            palindrome: "",
            dbPalindromes: {"palindromes": []},
            palfilters: {
                palFilterType: PalFilterType.ALL,
                onlyMine: false,
                textFilter: "",
            },
            allNone: false,
            columnState: {
                sortInfo: {
                    sortCol: "",
                    sortDesc: true
                }
            }
        }
    }

    componentDidMount() {
        this.reloadFromDb();
    }

    reloadFromDb() {
        var thePalindromes = {"palindromes": Array()};
        db.collection("/palindromes").get().then((querySnapshot) => {
//                console.log("querySnapShot " + JSON.stringify(querySnapshot));
            querySnapshot.forEach((doc) => {
                // console.log(JSON.stringify(doc.data().user));
                var theRaw = `${doc.data().raw}`;
                var theCooked = `${doc.data().cooked}`;
                var theUser = `${doc.data().user}`;
                // if (theUser.startsWith("{")) {
                //     theUser = JSON.parse(theUser).uid;
                // }
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
//            console.log("After querySnap.forEach: " + JSON.stringify(thePalindromes.palindromes));
            this.setState({
                dbPalindromes: thePalindromes
            });
        });
        return thePalindromes;
    }

    //console.log("byId? " + JSON.stringify(thePalindromes.palindromes.filter(obj => obj.id === "0OMgK4Bd5cFLa8pw5O4m")));

    onChange = (value: any) => {
        this.setState(() => ({
            palindrome: value,
        }));
    };

    reverseText = (str: any) => {
        const flipped = this.reverseString(str);
        this.setState(() => ({
            palindrome: flipped,
        }));
        return flipped;
    };

    checkPalindrome = (str: any) => {
        return this.isPalindrome(str);
    };

    saveText = (str: any) => {
        if (!str) {
            return "";
        }

        this.addToDb(str);
        this.reloadFromDb();
        return str;
    };

    deleteSelected = () => {
        var selected = this.state.dbPalindromes.palindromes.filter(pal => pal.selected);
        selected.map(pal => {
            this.deleteDocument(pal);
            this.reloadFromDb();
            this.forceUpdate();
            return pal;
        });
    };

    deleteDocument = (pal: any) => {
        db.collection("/palindromes").doc(pal.id).delete().then(function () {
            console.log("Palindrome successfully deleted " + JSON.stringify(pal));
        }).catch(function (error) {
            console.error("Error removing document: ", error);
        });
    };

    addToDb = (str: any) => {
        const userJSON: any = firebase.auth().currentUser?.toJSON();
        const reducedJson = JSON.stringify(Object.keys(userJSON).reduce((obj: any, key) => {
                if (["uid", "displayName"].includes(key)) {
                    obj[key] = userJSON[key];
                }
                return obj;
            }, {}
        ));
        // console.log("addingtoDB:\n",reducedJson);
        db.collection("palindromes").add({
            raw: str,
            cooked: this.normalizeString(str),
            createTime: firestore.Timestamp.fromDate(new Date()),
            user: reducedJson,
        })
            .then(function (docRef) {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });
    };

    evaluatePalFilters = (palEntry: IDbPalindrome) => {
        let palTypeOk = true;
        switch (this.state.palfilters.palFilterType) {
            case PalFilterType.ONLY_PALINDROMES:
                palTypeOk = this.isPalindrome(palEntry.cooked);
                break;
            case PalFilterType.NOT_PALINDROMES:
                palTypeOk = !this.isPalindrome(palEntry.cooked);
                break;
            case PalFilterType.ALL:
            default:
                palTypeOk = true;
        }
        let theUser = palEntry.user;
        if (theUser.startsWith("{")) {
            theUser = JSON.parse(theUser).uid;
        }
        let onlyMineOk = this.state.palfilters.onlyMine ? (theUser === firebase.auth().currentUser?.uid) : true;

        // check textFilter
        let textFilterOk =  this.state.palfilters.textFilter.length === 0 ||
            palEntry.cooked.includes(this.state.palfilters.textFilter);

        return palTypeOk && onlyMineOk && textFilterOk;
    };

    //
    handleTextFilter = (event: any) => {
        let theTextFilter = this.normalizeString(event.target.value).trim();
        let thePalindromes = this.state.dbPalindromes.palindromes.slice();
            // unselect the entries hidden to avoid acting on hidden entries
            thePalindromes.map((entry) => {
                if (!entry.raw.includes(theTextFilter)) {
                    entry.selected = false;
                }
                return entry;
            });

        let thePalType = this.state.palfilters.palFilterType;
        let theOnlyMine = this.state.palfilters.onlyMine;
        this.setState({
            palfilters: {
                palFilterType: thePalType,
                onlyMine: theOnlyMine,
                textFilter: theTextFilter
            },
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    handleOnlyMineChecked = () => {
        let isChecked = !this.state.palfilters.onlyMine;
        let thePalindromes = this.state.dbPalindromes.palindromes.slice();
        if (isChecked) {
            // deselect the hidden ones to avoid inadvertent action on them
            thePalindromes.map((entry) => {
                let theUser = entry.user;
                if (theUser.startsWith("{")) {
                    theUser = JSON.parse(theUser).uid;
                }
                let isMine = (theUser === firebase.auth().currentUser?.uid);
                if (!isMine) {
                    entry.selected = false;
                }
                return entry;
            });
        }
        let thePalType = this.state.palfilters.palFilterType;
        let theTextFilter = this.state.palfilters.textFilter;
        this.setState({
            palfilters: {
                palFilterType: thePalType,
                onlyMine: isChecked,
                textFilter: theTextFilter
            },
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    handleChecked = (event: any) => {
        var docId = event.target.value;
        var thePalindromes = this.state.dbPalindromes.palindromes.slice();
        var position = thePalindromes.findIndex(function (element) {
            return element.id === docId
        });

        thePalindromes[position].selected = !thePalindromes[position].selected;

//        console.log("item : " + JSON.stringify(thePalindromes[position]));
        this.setState({
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    handleSortOrder = (event: any) => {
        let headerId = event.target.id;
        let direction = this.state.columnState.sortInfo.sortDesc;
        if (this.state.columnState.sortInfo.sortCol === headerId) {
            direction = !direction;
        }

        var sortInfo = {
            sortCol: headerId,
            sortDesc: direction
        };
        this.setState({
            columnState: {
                sortInfo: sortInfo
            }
        });
        return sortInfo;
    };


    handleAllNoneChecked = () => {
        var isSelected = !this.state.allNone;
        var thePalindromes = this.state.dbPalindromes.palindromes.slice();
        thePalindromes.map((entry) => entry.selected = isSelected && this.evaluatePalFilters(entry));
        this.setState({
            dbPalindromes: {palindromes: thePalindromes},
            allNone: isSelected
        });
    };

    handleOptionChange = (event: { target: { value: string; }; }) => {
        const palFilterTyperEnum = event.target.value as PalFilterType;
        let thePalindromes = this.state.dbPalindromes.palindromes.slice();
        if (palFilterTyperEnum !== PalFilterType.ALL) {
            // deselect the hidden ones to avoid inadvertent action on them
            thePalindromes.map((entry) => {
                entry.selected = this.isPalindrome(entry.cooked) ?
                    entry.selected && palFilterTyperEnum === PalFilterType.ONLY_PALINDROMES :
                    entry.selected && palFilterTyperEnum === PalFilterType.NOT_PALINDROMES;
                return entry;
            });
        }
        let onlyMine = this.state.palfilters.onlyMine;
        let theTextFilter = this.state.palfilters.textFilter;
        this.setState({
            dbPalindromes: {palindromes: thePalindromes},
            palfilters: {
                palFilterType: palFilterTyperEnum,
                onlyMine: onlyMine,
                textFilter: theTextFilter
            }
        });
    };

    render() {

        let haveInput = this.state.palindrome.length > 0;
        let smoothedParts = this.smooth(this.state.palindrome);
        smoothedParts[1] = <span className={"midpoint"}>{smoothedParts[1]}</span>

        return (
            <div>
                <div>Enter text to create a palindrome:</div>
                <div
                    className={"input-area section-border"}>
                    {/*bind methods for the child */}
                    <TextInput onChange={this.onChange.bind(this)}
                               reverseText={this.reverseText.bind(this)}
                               saveText={this.saveText.bind(this)}
                               checkPalindrome={this.checkPalindrome.bind(this)}
                    />
                </div>
                {haveInput &&
                <div>
                    <div>
                        <label>Input as typed
                            <div placeholder="Input As Typed" className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>
                                {this.state.palindrome}
                            </div>
                        </label>
                    </div>
                    <div placeholder={"Turnaround"}>Reversed input: (Turnaround is {smoothedParts[1]})</div>
                    <div placeholder="Reversed Input"
                        className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>{smoothedParts}</div>
                </div>}

                <div>
                    <div>
                        <div>Saved palindromes:</div>
                    </div>
                    <div className={"indent"}>
                        <button className="pal-button"
                                onClick={this.deleteSelected}
                                disabled={this.state.dbPalindromes.palindromes.filter(pal => pal.selected).length === 0}
                        >
                            Delete Selected
                        </button>
                        <div className={"right-just"}>
                            <span><strong>Filters:&nbsp;</strong></span>
                            <input placeholder={"search text"}
                                type="text"
                                name="textFilter"
                                onChange={this.handleTextFilter}
                            />&nbsp;&nbsp;|&nbsp;&nbsp;
                            <input
                                type="checkbox"
                                name="onlyMine"
                                checked={this.state.palfilters.onlyMine}
                                onChange={this.handleOnlyMineChecked}
                                value={"value"}
                                className={"checkbox"}
                            />
                            Only mine&nbsp;&nbsp;|&nbsp;&nbsp;
                            <div className="radio-button">
                                <label>
                                    <input
                                        type="radio"
                                        name="palfilter"
                                        value={PalFilterType.ALL}
                                        checked={this.state.palfilters.palFilterType === PalFilterType.ALL}
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
                                        value={PalFilterType.ONLY_PALINDROMES}
                                        checked={this.state.palfilters.palFilterType === PalFilterType.ONLY_PALINDROMES}
                                        onChange={this.handleOptionChange}
                                        className=""
                                    />
                                    Palindromes
                                </label>
                            </div>
                            <div className="radio-button">
                                <label>
                                    <input
                                        type="radio"
                                        name="palfilter"
                                        value={PalFilterType.NOT_PALINDROMES}
                                        checked={this.state.palfilters.palFilterType === PalFilterType.NOT_PALINDROMES}
                                        onChange={this.handleOptionChange}
                                        className=""
                                    />
                                    Non-palindromes
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="indent">
                        <table className={"list section-border palindrome-list"}>
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
                                    initSort={this.state.columnState}
                                    headerText={"User"}
                                    markerClass={"palListSorter"}
                                />
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.dbPalindromes.palindromes
                                .filter(pal => this.evaluatePalFilters(pal))
                                .slice().sort((a, b) => this.comparePals(a, b))
                                .map((item, key) =>
                                    <tr key={key}>
                                        <td>
                                            {this.isCurrentUser(item.user)
                                            && <input
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
                                            {this.getUserName(item.user)}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    isCurrentUser = (user: any) => {
        let theJson = JSON.parse(user);
        return (theJson.uid === firebase.auth().currentUser?.uid);
    };

    getUserName = (user: any) => {
        let theJson = JSON.parse(user);
        return theJson.displayName ? theJson.displayName : theJson.uid;
    }

    comparePals = (a: any, b: any) => {
        switch (this.state.columnState.sortInfo.sortCol) {
            case "createdColumn":
                return this.state.columnState.sortInfo.sortDesc ? b.createTime - a.createTime : a.createTime - b.createTime;
            case "entryColumn":
                return this.state.columnState.sortInfo.sortDesc ? b.raw.localeCompare(a.raw) : a.raw.localeCompare(b.raw);
            case "uidColumn":
                let aName = this.getUserName(a.user);
                let bName = this.getUserName(b.user);
                return this.state.columnState.sortInfo.sortDesc ? bName.localeCompare(aName) :
                    aName.localeCompare(bName);
            default:
                return 0;
        }
    };

    reverseString(str: string) {
        return str.split("").reverse().join("");
    }

    /** Removes whitespace, punctuation and diacriticals, then formats with one space between uppercase characters
     * I have found this to be the easiest format for the eye to pick up on word patterns.
     * */
    normalizeString(str: string) {
        return this.stripWhiteSpace(this.stripPunctuation(this.stripDiacriticals(str))).toUpperCase()
            .split("").join(" ");
    }

    /**
     * Strips all diacriticals (accented or decorated characters) by separating the parts, and removing the non-alphanumeric.
     * TODO: Known issues - "ß" which ends up as "ss" not "s" and æ which ends up as "ae" and perhaps some other similar
     *
     * */
    stripDiacriticals(str: string) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    /**
     * Strips all puncutation
     * It's a fairly exhaustive regex I found on the web so it must be correct :)
     *
     * */
    stripPunctuation(str: string) {
        return str.replace(
            /[!-/:-@[-`{-~¡-©«-¬®-±´¶-¸»¿×÷˂-˅˒-˟˥-˫˭˯-˿͵;΄-΅·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿᾽᾿-῁῍-῏῝-῟῭-`´-῾\u2000-\u206e⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-\u2e7e⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〿゛-゜゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꜀-꜖꜠-꜡꞉-꞊꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-｀｛-･￠-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g,
            "");
    }

    /**
     * Strips all white space
     * */
    stripWhiteSpace(str: string) {
        return str.replace(/\s/g, "");
    }

    /**
     * Checks if str is a plindrome by normalizing it and comparing to its reverse
     * */
    isPalindrome(str: string) {
        var normal = this.normalizeString(str);
        return normal === this.reverseString(normal);
    }


    /** Does the following:
     * 1. normailize (emoves whitespace, punctuation and diacriticals, then formats with one space between uppercase characters
     * I have found this to be the easiest format for the eye to pick up on word patterns.
     * 2. revese string
     * 3. return array with three strings: before the midpoint, the midpoint or turnaround string, after the midpoint
     * */
    smooth(str: any) {
        var smooth = this.reverseString(this.normalizeString(str));
        var nChars = (smooth.length + 1) / 2;
        var turnaroundSize = ((nChars % 2) === 0 ? 4 : 3);
        var parts = Array();
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
    palindromeClass(str: string) {
        return str ? (this.isPalindrome(str) ? "is-pal" : "not-pal") : "";
    }
}

// ========================================
export default Palindrome;