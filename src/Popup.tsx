import React from 'react';
import './popup.css';


/**
 * Component to display some html in a popup
 *
 * */
interface IPopupState {
}

interface IPopupProps {
    html: any;
    buttonText: string;
    closePopup(): any;
}

class Popup extends React.Component<IPopupProps, IPopupState> {
    render() {
        return (
            <div className='popup'>
                <div className='popup\_inner'>
                    <div>
                        <button  className={"center"} onClick={this.props.closePopup}>{this.props.buttonText}</button>
                        {this.props.html}
                    </div>
                </div>
            </div>
        );
    }
}

export default Popup;