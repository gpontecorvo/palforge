import * as React from "react";
import './index.css';
import firebase from "./firebase";
import "firebase/auth";

import TextInput from "./TextInput";
import ColumnClickDisplay, {IColumnClickDisplayState} from "./ColumnClickDisplay";
import Popup from "./Popup";
import {firestore} from "firebase";

let WRITE_SUCCESS_AS_ERROR = false;

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
    createTime: Date;
    user: any;
    archived: boolean;
}

interface IUnsubscribe {
    (): void
}

interface IPalindromeForgeState {
    palindrome: string;
    dbPalindromes: {
        palindromes: IDbPalindrome[];
    };
    palfilters: {
        palFilterType: PalFilterType;
        textFilter: string;
        onlyMine: boolean;
        includeArchived: boolean;
    }
    allNone: boolean;
    columnState: IColumnClickDisplayState;
    logEntries: string[];
    logShown: boolean;
    adminMode: boolean;
    writeSuccessToLog: boolean;
    unsubscribe: IUnsubscribe;
}

interface IPalindromeForgeProps {
    adminMode: boolean;
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
class PalindromeForge extends React.Component<IPalindromeForgeProps, IPalindromeForgeState> {
    constructor(props: any) {
        super(props);
        this.state = {
            palindrome: "",
            dbPalindromes: {"palindromes": []},
            palfilters: {
                palFilterType: PalFilterType.ALL,
                onlyMine: false,
                textFilter: "",
                includeArchived: false
            },
            allNone: false,
            columnState: {
                sortInfo: {
                    sortCol: "",
                    sortDesc: true
                }
            },
            logEntries: [],
            logShown: false,
            writeSuccessToLog: false,
            adminMode: this.props.adminMode || false,
            unsubscribe: () => {
            }
        }
    }
    ;

    startListening(): IUnsubscribe {
        let theUnsubscribe = this.reloadFromDb();
        this.setState({
            unsubscribe: theUnsubscribe
        })
        console.log("subscribed....");
        return theUnsubscribe;
    }

    stopListening() {

        this.state.unsubscribe();
        console.log("unscubscrbed.....")
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.log("in componentDidCatch ", error, errorInfo);
    }

    componentDidMount(): void {
        this.startListening();
    }

    componentWillUnmount(): void {
        this.stopListening();
    }


    reloadFromDb(): IUnsubscribe {
        console.log("in reload()");
        let outerThis = this;
        let theUnsubscribe = db.collection("/palindromes")
            .onSnapshot(function (snapshot) {
                var thePalindromes = outerThis.state.dbPalindromes;
                snapshot.docChanges().forEach(function (change) {
                    let now = Date.now();
                    if (change.type === "added") {
                        let message = now.toLocaleString() + " New Palindrome: " + change.doc.data();
                        console.log(message);
                        // outerThis.addError("Success: " + message);
                    }
                    if (change.type === "modified") {
                        let message = now.toLocaleString() + "Modified Palindrome: " + change.doc.data();
                        console.log(message);
                        // outerThis.addError("Success: " + message);
                    }
                    if (change.type === "removed") {
                        let message = now.toLocaleString() + "Removed Palindrome: " + change.doc.data();
                        console.log(message);
                        // outerThis.addError("Success: " + message);
                    }
                    console.log("In listener function, change.type =  ", change.type);
                    if (change.type === "added") {
                        var theRaw = `${change.doc.data().raw}`;
                        var theCooked = `${change.doc.data().cooked}`;
                        var theUser = `${change.doc.data().user}`;
                        var theArchived = String(`${change.doc.data().archived}`) === "true";
                        // if (theUser.startsWith("{")) {
                        //     theUser = JSON.parse(theUser).uid;
                        // }
                        var theId = `${change.doc.id}`;
                        // var theCreateTime = new Date(1000 * Number(`${doc.data().createTime.seconds}`));
                        var theCreateTime = new Date(1000 * Number(`${change.doc.data().createTime.seconds}`));
                        //console.log("---Reloading another)");
                        thePalindromes.palindromes.push({
                            "raw": theRaw,
                            "cooked": outerThis.normalizeString(theCooked),
                            "id": theId,
                            "selected": false,
                            "createTime": theCreateTime,
                            "user": theUser,
                            "archived": theArchived
                        });
                    }
                    if (change.type === "removed") {
                        thePalindromes.palindromes = thePalindromes.palindromes.filter(function(value, ){ return value.id !== `${change.doc.id}`;});
                    }

                });
                // console.log("After querySnap.forEach: " + JSON.stringify(thePalindromes.palindromes));
                //test errors:
                outerThis.setState({
                    dbPalindromes: thePalindromes
                });
                if (WRITE_SUCCESS_AS_ERROR) {
                    outerThis.addError("Success: fetched all the documents: " + JSON.stringify(thePalindromes.palindromes));
                }
            }, function (error) {
                outerThis.addError("Error getting documents: " + error);

            });

        return theUnsubscribe;
    }

    formatError = (error: any) => {
        return ("There was a problem in th appliction most likely due to " +
            "Google Firebase quotas being exceed on the free account" +
            " in which this app is running: " + error);
    }

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

    saveText = async (str: any) => {
        if (!str) {
            return "";
        }

        let newPal: any = {};
        console.log("in saveText before addToDb");
        await this.addToDb(str).then(function (result) {
            newPal = result;
            console.log("in save text added", newPal);
        });
        //      this.reloadFromDb();
        // let thePalindromes = this.state.dbPalindromes.palindromes;
        // thePalindromes.push(newPal);
        // this.setState({
        //     dbPalindromes: {palindromes: thePalindromes}
        // });
        return str;
    };

    deleteSelected = () => {
        var selected = this.state.dbPalindromes.palindromes.filter(pal => pal.selected);
        selected.map(pal => {
            this.deleteDocument(pal);
            // this.reloadFromDb();
            this.forceUpdate();
            return pal;
        });
        // var notSelected = this.state.dbPalindromes.palindromes.filter(pal => !pal.selected);
        //
        // this.setState({
        //     dbPalindromes: {palindromes: notSelected}
        // });

    };

    handleArchiveSelected = (event: any) => { //: React.MouseEvent<HTMLButtonElement, MouseEvent>
        var thePalindromes = this.state.dbPalindromes.palindromes.slice();
        const trueFalse = String(event.target.value) === "true";
        thePalindromes.map(pal => {
            if (pal.selected) {
                pal.archived = trueFalse;
                this.changeArchive(pal);
            }
            return pal;
        });
        this.setState({
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    deleteDocument = (pal: any) => {
        let outerThis = this;
        db.collection("/palindromes").doc(pal.id).delete().then(function () {
            console.log("Palindrome successfully deleted " + JSON.stringify(pal));
            if (WRITE_SUCCESS_AS_ERROR) {
                outerThis.addError("Success : Palindrome successfully deleted " + JSON.stringify(pal));
            }
        }).catch(function (error) {
            error = "Error deleting document: " + error;
            outerThis.addError(error);
        });
    };

    changeArchive = (pal: any) => {
        let outerThis = this;
        db.collection("/palindromes").doc(pal.id).update({
            "archived": pal.archived
        }).then(function () {
            console.log("Palindrome successfully updated " + JSON.stringify(pal));
            if (WRITE_SUCCESS_AS_ERROR) {
                outerThis.addError("Success : Palindrome successfully updated " + JSON.stringify(pal));
            }
        }).catch(function (error) {
            error = "Error updating document: " + error;
            outerThis.addError(error);
        });
    };

    addToDb = async (str: any) => {
        const userJSON: any = firebase.auth().currentUser?.toJSON();
        const reducedJson = JSON.stringify(Object.keys(userJSON).reduce((obj: any, key) => {
                if (["uid", "displayName"].includes(key)) {
                    obj[key] = userJSON[key];
                }
                return obj;
            }, {}
        ));
        // console.log("addingtoDB:\n",reducedJson);
        let outerThis = this;

        let timeStamp = firestore.Timestamp.fromDate(new Date());

        let newPal: any = {};
        await db.collection("palindromes").add({
            raw: str,
            cooked: this.stripWhiteSpace(this.normalizeString(str)), // save space in DB, remove spaces
            createTime: timeStamp,
            user: reducedJson,
            archived: false
        })
            .then(function (docRef) {
                console.log("Document written with ID: ", docRef.id);
                newPal = {
                    raw: str,
                    cooked: outerThis.stripWhiteSpace(outerThis.normalizeString(str)),
                    id: docRef.id,
                    selected: false,
                    createTime: new Date(timeStamp.seconds * 1000),
                    user: reducedJson,
                    archived: false
                };

                if (WRITE_SUCCESS_AS_ERROR) {
                    outerThis.addError("Success : Document written with ID: " + docRef.id);
                }
            })
            .catch(function (error) {
                error = "Error adding document: " + error;
                outerThis.addError(error);
            });
        return newPal;
    };

    addError = (error: any) => {
        console.error(error);
        let theErrors = this.state.logEntries.slice();
        theErrors.push("__ Error Time: " + new Date().toLocaleString() + "_____");
        theErrors.push(this.formatError(error));

        this.setState({
            logEntries: theErrors,
        });
    }

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

        let theUser = JSON.parse(palEntry.user).uid;
        let onlyMineOk = this.state.palfilters.onlyMine ? (theUser === firebase.auth().currentUser?.uid) : true;

        // check textFilter
        let textFilterOk = this.state.palfilters.textFilter.trim().length === 0 ||
            palEntry.cooked.includes(this.state.palfilters.textFilter);

        // check archive filter
        let archiveFilterOk = this.state.palfilters.includeArchived ? true : !palEntry.archived;

        return palTypeOk && onlyMineOk && textFilterOk && archiveFilterOk;
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

        let thePalfilters = this.state.palfilters;
        thePalfilters.textFilter = theTextFilter;

        this.setState({
            palfilters: thePalfilters,
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
        let thePalfilters = this.state.palfilters;
        thePalfilters.onlyMine = isChecked;
        this.setState({
            palfilters: thePalfilters,
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    handleArchiveChecked = () => {
        let nextState = !this.state.palfilters.includeArchived;
        let thePalindromes = this.state.dbPalindromes.palindromes.slice();
        if (nextState) {
            // deselect the hidden ones to avoid inadvertent action on them
            thePalindromes.map((entry) => {
                if (!entry.archived) {
                    entry.selected = false;
                }
                return entry;
            });
        }

        let thePalfilters = this.state.palfilters;
        thePalfilters.includeArchived = nextState;
        this.setState({
            palfilters: thePalfilters,
            dbPalindromes: {palindromes: thePalindromes}
        });
    };

    handleSelected = (event: any) => {
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
        const palFilterTypeEnum = event.target.value as PalFilterType;
        let thePalindromes = this.state.dbPalindromes.palindromes.slice();
        if (palFilterTypeEnum !== PalFilterType.ALL) {
            // deselect the hidden ones to avoid inadvertent action on them
            thePalindromes.map((entry) => {
                entry.selected = this.isPalindrome(entry.cooked) ?
                    entry.selected && palFilterTypeEnum === PalFilterType.ONLY_PALINDROMES :
                    entry.selected && palFilterTypeEnum === PalFilterType.NOT_PALINDROMES;
                return entry;
            });
        }

        let thePalfilters = this.state.palfilters;
        thePalfilters.palFilterType = palFilterTypeEnum;
        this.setState({
            palfilters: thePalfilters,
            dbPalindromes: {palindromes: thePalindromes}
        });

    };

    createErrorHtml = (errors: string[]) => {
        return (
            <div className={"privacypolicy section-border padded "}>
                {errors.map
                ((error, key) => {
                    return (
                        <p key={key}>
                            {error}
                        </p>
                    );
                })}
            </div>
        );
    }

    render() {

        let haveInput = this.state.palindrome.length > 0;
        let smoothedParts = this.smooth(this.state.palindrome);
        smoothedParts[1] = <span className={"midpoint"}>{smoothedParts[1]}</span>

        return (
            <div>
                <div>
                    {this.state.logEntries.length > 0 &&
                    <span className={""}>
                        <button onClick={() => {
                            let errorShown = !this.state.logShown;
                            this.setState({
                                logShown: errorShown
                            });
                        }}>Show Errors</button>
                        {
                            this.state.logShown &&
                            <Popup
                                html={this.createErrorHtml(this.state.logEntries)}
                                buttonText={"Hide Errors"}
                                closePopup={() => {
                                    let errorShown = !this.state.logShown;
                                    this.setState({
                                        logShown: errorShown
                                    });
                                }}
                            />
                        }
                        <button onClick={() => {
                            this.setState({
                                logEntries: []
                            });
                        }}>Clear Errors</button>
                </span>
                    }

                </div>
                {/*<div>Enter text to create a palindrome:</div>*/}
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
                            <div placeholder="Input As Typed"
                                 className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>
                                {this.state.palindrome}
                            </div>
                        </label>
                    </div>
                    <div placeholder={"Turnaround"}>Reversed input: (Turnaround is {smoothedParts[1]})</div>
                    <div placeholder="Reversed Input"
                         className={"indent section-border " + this.palindromeClass(this.state.palindrome)}>{smoothedParts}</div>
                </div>}

                <div>
                    <div className={"indent"}>
                        <div className={""}>
                            <table className={"app-banner"}>
                                <thead>
                                <tr>
                                    <th colSpan={2}>
                                        Selected Actions
                                    </th>

                                    <th colSpan={2}>
                                        Filters
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>
                                        <button className="pal-button"
                                                onClick={this.deleteSelected}
                                                disabled={this.state.dbPalindromes.palindromes.filter(pal => pal.selected).length === 0}
                                        >Delete Selected
                                        </button>
                                    </td>
                                    <td></td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            name="onlyMine"
                                            checked={this.state.palfilters.onlyMine}
                                            onChange={this.handleOnlyMineChecked}
                                            value={"value"}
                                            className={"checkbox"}
                                        />Only mine
                                    </td>
                                    <td>
                                        <div className="radio-button">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="palfilter"
                                                    value={PalFilterType.ALL}
                                                    checked={this.state.palfilters.palFilterType === PalFilterType.ALL}
                                                    onChange={this.handleOptionChange}
                                                    className=""
                                                />All
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
                                                />Palindromes
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
                                                />Non-palindromes
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <button className="pal-button"
                                                value={"true"}
                                                onClick={this.handleArchiveSelected}
                                                disabled={this.state.dbPalindromes.palindromes.filter(pal => pal.selected).length === 0}
                                        >Archive Selected
                                        </button>

                                    </td>
                                    <td>
                                        <button className="pal-button"
                                                onClick={this.handleArchiveSelected}
                                                value={"false"}
                                                disabled={this.state.dbPalindromes.palindromes.filter(pal => pal.selected).length === 0}
                                        >Un-archive Selected
                                        </button>

                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            name="archived"
                                            checked={this.state.palfilters.includeArchived}
                                            onChange={this.handleArchiveChecked}
                                            value={"value"}
                                            className={"checkbox"}
                                        />Archived
                                    </td>
                                    <td>
                                        <input placeholder={"search text"}
                                               size={46}
                                               type="text"
                                               name="textFilter"
                                               onChange={this.handleTextFilter}
                                        />
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="indent">
                        <table className={"list section-border palindrome-list"}>
                            <thead>
                            <tr>
                                <th>
                                    {this.props.adminMode && <span className={"even-smaller"}>ADMIN<br/>Override</span>}
                                    <input
                                        type="checkbox"
                                        name="allNone"
                                        checked={this.state.allNone}
                                        onChange={this.handleAllNoneChecked}
                                        value={"value"}
                                        className={"checkbox"}
                                    />
                                    {/*{this.props.adminMode &&  <span className={"even-smaller"}><br/>Override</span>}*/}
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
                                            {(this.props.adminMode && !this.isCurrentUser(item.user)) &&
                                            <span className={"even-smaller"}>ADMIN<br/></span>}
                                            {(this.isCurrentUser(item.user) || this.props.adminMode)
                                            && <input
                                                type="checkbox"
                                                name="listitems"
                                                checked={item.selected}
                                                onChange={this.handleSelected}
                                                value={item.id}
                                                className={"checkbox"}
                                            />}
                                            {item.archived && <span className={"even-smaller"}><br/>archived</span>}

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
                return this.state.columnState.sortInfo.sortDesc ? b.createTime - a.createTime: a.createTime - b.createTime;
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
export default PalindromeForge;
