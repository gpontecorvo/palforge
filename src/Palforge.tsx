import * as React from "react";
import './index.css';
import Palindrome from "./Palindrome";

/**
 * Main cllass to contain the working part(s)
 */
class Palforge extends React.Component {
    render() {
        return (
            <div>
                <div>
                    <div className="palforge">
                        <Palindrome/>
                    </div>
                </div>
            </div>
        );
    }
}

// ========================================
export default Palforge;

