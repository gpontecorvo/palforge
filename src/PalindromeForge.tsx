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

enum TextFilterType {
    IGNORE_SPACE_AND_PUNCTUATION = "IGNORE_SPACE_AND_PUNCTUATION",
    EXACT_CASE_INSENSITIVE = "EXACT_CASE_INSENSITIVE",
}

interface IDbPalindrome {
    raw: string;
    cooked: string;
    id: string;
    selected: boolean;
    createTime: Date;
    user: any;
    ownerUid: string;
    ownerDisplayName: string;
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
        textFilterSearchBy: string;
        textFilterType: TextFilterType;
        onlyMine: boolean;
        includeArchived: boolean;
    }
    allNone: boolean;
    columnState: IColumnClickDisplayState;
    logEntries: string[];
    logShown: boolean;
    unsubscribe: IUnsubscribe;
}

interface IPalindromeForgeProps {
    adminMode: boolean;
    writeSuccessToLog: boolean;
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
                textFilterSearchBy: "",
                textFilterType: TextFilterType.IGNORE_SPACE_AND_PUNCTUATION,
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
            unsubscribe: () => {
            }
        }
    };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.addLogEntry("in componentDidCatch " + error + " " + errorInfo, true);
    }

    componentDidMount(): void {
        let theUnsubscribe = this.dbPalindromeListener();
        this.setState({
            unsubscribe: theUnsubscribe
        });
        console.log("subscribed to dbPalindromeListener");
    }

    componentWillUnmount(): void {
        this.state.unsubscribe();
        this.setState({
            unsubscribe: () => {
            }
        });
        console.log("unsubscribed from dbPalindromeListener")
    }

    dbPalindromeListener(): IUnsubscribe {
        console.log("in reload()");
        let outerThis = this;
        let theUnsubscribe = db.collection("/palindromes")
            .onSnapshot(function (snapshot) {
                var thePalindromes = outerThis.state.dbPalindromes;
                snapshot.docChanges().forEach(function (change) {
                    if (change.type === "added") {
                        var theRaw = `${change.doc.data().raw}`;
                        var theCooked = `${change.doc.data().cooked}`;
                        var theUser = `${change.doc.data().user}`;
                        var theOwnerDisplayName = `${change.doc.data().ownerDisplayName}`;
                        var theOwnerUid = `${change.doc.data().ownerUid}`;
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
                            "ownerDisplayName": theOwnerDisplayName,
                            "ownerUid": theOwnerUid,
                            "archived": theArchived
                        });
                        if (outerThis.props.adminMode && outerThis.props.writeSuccessToLog) {
                            let message = "Added Palindrome: " + change.doc.data();
                            outerThis.addLogEntry("Success: " + message, false);
                        }

                    }
                    if (change.type === "removed") {
                        thePalindromes.palindromes = thePalindromes.palindromes.filter(function (pal) {
                            return pal.id !== `${change.doc.id}`;
                        });
                        if (outerThis.props.adminMode && outerThis.props.writeSuccessToLog) {
                            let message = "Removed Palindrome: " + change.doc.data();
                            outerThis.addLogEntry("Success: " + message, false);
                        }
                    }

                });
                //console.log("After querySnap.forEach: " + JSON.stringify(thePalindromes.palindromes));
                outerThis.setState({
                    dbPalindromes: thePalindromes
                });
                if (WRITE_SUCCESS_AS_ERROR) {
                    outerThis.addLogEntry("Success: fetched all the documents: " + JSON.stringify(thePalindromes.palindromes), false);
                }
            }, function (error) {
                outerThis.addLogEntry("Error getting documents: " + error, true);

            });

        return theUnsubscribe;
    }

    formatError = (entry: any, isError: boolean) => {
        let prepend = isError ? "There was a problem in the appliction possibly due to " +
            "Google Firebase quotas being exceeded on the hosting account " : "Success: "
        return (prepend + entry);
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
        await this.addPalindromeToDb(str).then(function (result) {
            newPal = result;
            console.log("in save text added", newPal);
        });
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
                outerThis.addLogEntry("Success : Palindrome successfully deleted " + JSON.stringify(pal), false);
            }
        }).catch(function (error) {
            error = "Error deleting document: " + error;
            outerThis.addLogEntry(error, true);
        });
    };

    changeArchive = (pal: any) => {
        let outerThis = this;
        db.collection("/palindromes").doc(pal.id).update({
            "archived": pal.archived
        }).then(function () {
            console.log("Palindrome successfully updated " + JSON.stringify(pal));
            if (WRITE_SUCCESS_AS_ERROR) {
                outerThis.addLogEntry("Success : Palindrome successfully updated " + JSON.stringify(pal), false);
            }
        }).catch(function (error) {
            error = "Error updating document: " + error;
            outerThis.addLogEntry(error, true);
        });
    };

    addPalindromeToDb = async (str: any) => {
        const userJSON: any = firebase.auth().currentUser?.toJSON();
        const reducedJson = JSON.stringify(Object.keys(userJSON).reduce((obj: any, key) => {
                if (["uid", "displayName"].includes(key)) {
                    obj[key] = userJSON[key];
                }
                return obj;
            }, {}
        ));
        let theDisplayName = userJSON.displayName;
        let theOwnerUid = userJSON.uid;
       // console.log("in addToDB:\n","theDisplayName ",theDisplayName,  " thOwnerUid ", theOwnerUid);
        let outerThis = this;

        let timeStamp = firestore.Timestamp.fromDate(new Date());

        let newPal: any = {};
        await db.collection("palindromes").add({
            raw: str,
            cooked: this.stripWhiteSpace(this.normalizeString(str)), // save space in DB, remove spaces
            createTime: timeStamp,
            user: reducedJson,
            ownerUid: theOwnerUid,
            ownerDisplayName: theDisplayName,
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
                    outerThis.addLogEntry("Success : Document written with ID: " + docRef.id, false);
                }
            })
            .catch(function (error) {
                error = "Error adding document: " + error;
                outerThis.addLogEntry(error, true);
            });
        return newPal;
    };

    addLogEntry = (logEntry: any, isError: boolean) => {
        console.log(isError ? console.error(logEntry) : console.log(logEntry));
        let theLog = this.state.logEntries.slice();
        theLog.push("-------- Time: " + new Date().toLocaleString() + "--------");
        theLog.push(this.formatError(logEntry, isError));

        this.setState({
            logEntries: theLog,
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

        let palfilters = this.state.palfilters;
        let onlyMineOk = palfilters.onlyMine ? (palEntry.ownerUid === firebase.auth().currentUser?.uid) : true;

        // check textFilter
        let textFilterOk = palfilters.textFilter.trim().length === 0 ||
            (palfilters.textFilterType === TextFilterType.EXACT_CASE_INSENSITIVE ? palEntry.raw.toLowerCase() : palEntry.cooked.toLowerCase())
                .includes(palfilters.textFilterSearchBy);

        // check archive filter
        let archiveFilterOk = palfilters.includeArchived ? true : !palEntry.archived;

        return palTypeOk && onlyMineOk && textFilterOk && archiveFilterOk;
    };

    //
    handleTextFilter = (event: any) => {
        let thePalfilters = this.state.palfilters;
        thePalfilters.textFilter = event.target.value;
        let theTextFilterSearchBy = (thePalfilters.textFilterType === TextFilterType.IGNORE_SPACE_AND_PUNCTUATION ? this.normalizeString(event.target.value) :
            event.target.value).toLowerCase().trim();
        thePalfilters.textFilterSearchBy = theTextFilterSearchBy;

        let thePalindromes = this.state.dbPalindromes.palindromes.slice();
        // unselect the entries hidden to avoid acting on hidden entries
        thePalindromes.map((entry) => {
            let textToCheck = (thePalfilters.textFilterType === TextFilterType.IGNORE_SPACE_AND_PUNCTUATION ? entry.cooked : entry.raw).toLowerCase().trim();
            if (!textToCheck.includes(theTextFilterSearchBy)) {
                entry.selected = false;
            }
            return entry;
        });

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

                let isMine = (entry.ownerUid === firebase.auth().currentUser?.uid);
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

    handlePalFilterTypeChange = (event: { target: { value: string; }; }) => {
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

    handleTextFilterTypeChange = (event: { target: { value: string; }; }) => {
        const textFilterTypeEnum = event.target.value as TextFilterType;

        let thePalfilters = this.state.palfilters;
        thePalfilters.textFilterType = textFilterTypeEnum;
        let theTextFilter = thePalfilters.textFilter;
        thePalfilters.textFilterSearchBy = (textFilterTypeEnum === TextFilterType.IGNORE_SPACE_AND_PUNCTUATION ? this.normalizeString(theTextFilter).toLowerCase() : theTextFilter).toLowerCase();
console.log (thePalfilters);
        this.setState({
            palfilters: thePalfilters,
        });

    };

    createLogHtml = (logEntries: string[]) => {
        return (
            <div className={"privacypolicy section-border padded "}>
                {logEntries.map
                ((entry, key) => {
                    return (
                        <p key={key}>
                            {entry}
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
                        <button className={"pal-button"} onClick={() => {
                            let theLogShown = !this.state.logShown;
                            this.setState({
                                logShown: theLogShown
                            });
                        }}>Show Log</button>
                        {
                            this.state.logShown &&
                            <Popup
                                html={this.createLogHtml(this.state.logEntries)}
                                buttonText={"Hide Log"}
                                closePopup={() => {
                                    let theLogShown = !this.state.logShown;
                                    this.setState({
                                        logShown: theLogShown
                                    });
                                }}
                            />
                        }
                        <button className={"pal-button"} onClick={() => {
                            this.setState({
                                logEntries: []
                            });
                        }}>Clear Log</button>
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
                                                    onChange={this.handlePalFilterTypeChange}
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
                                                    onChange={this.handlePalFilterTypeChange}
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
                                                    onChange={this.handlePalFilterTypeChange}
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
                                        <div className={"bordered"}>
                                            <input placeholder={"search text (case insensitive)"}
                                                   size={46}
                                                   type="text"
                                                   name="textFilter"
                                                   onChange={this.handleTextFilter}
                                            /><br/>
                                            <div className="radio-button">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="textfiltertype"
                                                        value={TextFilterType.IGNORE_SPACE_AND_PUNCTUATION}
                                                        checked={this.state.palfilters.textFilterType === TextFilterType.IGNORE_SPACE_AND_PUNCTUATION}
                                                        onChange={this.handleTextFilterTypeChange}
                                                        className=""
                                                    />Ignore Space and Punctuation
                                                </label>
                                            </div>
                                            <div className="radio-button">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="textfiltertype"
                                                        value={TextFilterType.EXACT_CASE_INSENSITIVE}
                                                        checked={this.state.palfilters.textFilterType === TextFilterType.EXACT_CASE_INSENSITIVE}
                                                        onChange={this.handleTextFilterTypeChange}
                                                        className=""
                                                    />Exact
                                                </label>
                                            </div>
                                        </div>
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
                                            {(this.props.adminMode && !this.isCurrentUser(item.ownerUid)) &&
                                            <span className={"even-smaller"}>ADMIN<br/></span>}
                                            {(this.isCurrentUser(item.ownerUid) || this.props.adminMode)
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
                                            {item.ownerDisplayName}
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

    isCurrentUser = (ownerUid: any) => {
        return (ownerUid === firebase.auth().currentUser?.uid);
    };

    // getUserName = (user: any) => {
    //     let theJson = JSON.parse(user);
    //     return theJson.displayName ? theJson.displayName : theJson.uid;
    // }

    comparePals = (a: any, b: any) => {
        switch (this.state.columnState.sortInfo.sortCol) {
            case "createdColumn":
                return this.state.columnState.sortInfo.sortDesc ? b.createTime - a.createTime : a.createTime - b.createTime;
            case "entryColumn":
                return this.state.columnState.sortInfo.sortDesc ? b.raw.localeCompare(a.raw) : a.raw.localeCompare(b.raw);
            case "uidColumn":
                let aName = a.ownerDisplayName;
                let bName = b.ownerDisplayName
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
