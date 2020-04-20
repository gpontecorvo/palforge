import * as React from "react";
import './index.css';


/**
 * Component to accept input with button hooks to parent <Palindrome/> to:
 * reverse what's been typed
 * check if it's a palindrome
 * save text to storage
 * clear storage
 *
 * */
interface ITextInputState {
    text: string;
    isPalindrome?: boolean;
}

interface ITextInputProps {
    onChange(name: string | undefined): any;
    checkPalindrome(name: string | undefined): any;
    reverseText(name: string | undefined): any;
    saveText(name: string | undefined): any;
}

class TextInput extends React.Component<ITextInputProps, ITextInputState> {
    constructor(props: any) {
        super(props);
        this.state = {
            text: "",
            isPalindrome: true,
        }
    }

    onChange = (e: any) => {
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
        const saved = this.state.text;
        this.props.saveText(saved);
        this.setState(() => ({
            text: saved,
        }));
    };

    render() {
        return (

            <div>
                <div>
                    <textarea placeholder={"Enter text to create palindromes"} className="palindrome-input" onChange={this.onChange.bind(this)}
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
                    <button className="pal-button"
                            onClick={this.reverseText.bind(this)}
                            disabled={this.state.text?.trim()?.length === 0}
                    >

                        Reverse input
                    </button>
                    <button className="pal-button"
                            onClick={this.saveText.bind(this)}
                            disabled={this.state.text?.trim()?.length === 0}
                    >
                        Save
                    </button>
                </div>
            </div>
        );
    }
}

// ========================================
export default TextInput;