import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class TextInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            text: "",
        }
    }

    onChange = (e) => {
        const value = e.target.value;
        this.props.onChange(value);
        this.setState( () => ({
            text: value,
        }));
    }

    reverseText = () => {
        const flipped = this.props.reverseText(this.state.text);
        this.setState( () => ({
            text: flipped,
        }));
    }

    saveText = () => {
        const saved = this.props.saveText(this.state.text);
        this.setState( () => ({
            text: saved,
        }));
    }

    clearSaved = () => {
        const saved = this.state.text;
        this.props.clearSaved();
        this.setState( () => ({
            text: saved,
        }));
    }



    render() {
        return (

            <div>
                <div>
                    <textarea  className="palindrome-input" onChange={this.onChange.bind(this)}
                               value  = {this.state.text} />
                </div>
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



class Palindrome extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            palindrome: "",
            savedPalsString: this.load(),
            savedPals: []

        }
    }

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

    saveText = (str) => {
        if (!str) {
            return "";
        }
//alert("saveText: " + str);
        const saveStr = str;
        let savedCopy = JSON.parse(JSON.stringify(this.state.savedPals));
        savedCopy.push({"key" : Date.now(), "pal":  saveStr});
        let saveString = JSON.stringify(savedCopy);
        this.setState( () => ({
            savedPals: savedCopy,
            savedPalsString: saveString,
        }));
       // alert("saveString: " + saveString);
        this.persist(saveString);
        return str;
    }

    clearSaved = () => {
        this.setState( () => ({
            savedPals: [],
            savedPalsString: "",
        }));
        this.persist("");
    }

    render() {
        const palColorClass = this.isPalindrome(this.state.palindrome) ? "is-pal" : "not-pal";
        let haveInput = this.state.palindrome.length > 0;
        let smoothedParts = this.smooth(this.state.palindrome);
        let smoothHtml = [];
        smoothHtml.push(<span>{smoothedParts[0]}</span>,
            <span className="midpoint">{smoothedParts[1]}</span>,
            <span>{smoothedParts[2]}</span>);
        if (this.state.savedPals.length === 0 && this.state.savedPalsString.length > 0) {
            const save = JSON.parse(this.state.savedPalsString);
            this.setState( () => ({
                savedPals: save,
            }));
        }

        return (
            <div>
                <div
                    className={ ["input-area", palColorClass].join(" ")}>
                    <TextInput
                        onChange={this.onChange.bind(this)}
                        reverseText={this.reverseText.bind(this)}
                        saveText={this.saveText.bind(this)}
                        clearSaved={this.clearSaved.bind(this)}
                    />
                </div>
                {!haveInput && <div>Enter text to create a palindrome</div>}
                {haveInput &&
                <div>
                    <div>It is {this.isPalindrome(this.state.palindrome) ? "" : "not "}a palindrome.</div>
                    <div>Input as typed:</div>
                    <div className="indent">{this.state.palindrome} </div>
                    <div>Reversed input: (Turnaround is <strong>{smoothedParts[1]}</strong>)</div>
                    <div className="indent">{smoothHtml}</div>
                </div>}
                <div>
                    {this.state.savedPals.length > 0 ? "Saved Palindromes" : ""}
                    <ul>
                        {this.state.savedPals.map((item, key) =>
                            <ol key={item.index}>{item.pal}  {this.number}</ol>)}
                    </ul>
                </div>
            </div>
        );
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

    stripDiacriticals(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    stripPunctuation(str) {
        return str.replace(
            /[!-/:-@[-`{-~¡-©«-¬®-±´¶-¸»¿×÷˂-˅˒-˟˥-˫˭˯-˿͵;΄-΅·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿᾽᾿-῁῍-῏῝-῟῭-`´-῾\u2000-\u206e⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-\u2e7e⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〿゛-゜゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꜀-꜖꜠-꜡꞉-꞊꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-｀｛-･￠-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g,
            "");
    }

    stripWhiteSpace(str) {
        return str.replace(/\s/g, "");
    }
//123456789
    isPalindrome(str) {
        var normal = this.normalizeString(str);
        return normal === this.reverseString(normal);
    }
    smooth (str) {
        var smooth = this.reverseString(this.normalizeString(str));
        //alert ("|" + smooth + "|");
        var nChars = (smooth.length+1)/2;
        var turnaroundSize = ((nChars % 2) === 0 ? 4 : 3);
        var parts = [];
        parts.push(smooth.substring(0, nChars - turnaroundSize ));
        parts.push(smooth.substring(nChars - turnaroundSize , (nChars - turnaroundSize) + turnaroundSize*2 ));
        parts.push(smooth.substring((nChars - turnaroundSize) + turnaroundSize*2 ));

        return parts;
    }

    load = () => {
        return localStorage.getItem("savedPals") || "";
    }

    persist = (str) => {
        return localStorage.setItem("savedPals", str);
    }
}



class Palforge extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [
                {
                    palindromes: Array(9).fill(null)
                }
            ],

        }
    }

    render() {
        return (
            <div>
                <div>
                    <h2>The Palindrome Forge</h2>
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
