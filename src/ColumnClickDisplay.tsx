import * as React from "react";
import "./ColumnClickDisplay.css";

export interface IColumnClickDisplayState {
    sortInfo: {
        sortCol: string;
        sortDesc: boolean;
    }
}

export interface IColumnClickDisplayProps {
    handleSortOrder(name: any): any;

    columnId: string;
    initSort?: IColumnClickDisplayState;
    headerText: string;
    markerClass: string;
}

/**
 * Component to display a clickable column header. The actual sorting is done by the parent component,
 * the click action is bound to the parent
 */
class ColumnClickDisplay extends React.Component<IColumnClickDisplayProps, IColumnClickDisplayState> {
    constructor(props: any) {
        super(props);
        this.state = {
            sortInfo: {
                sortCol: this.props.initSort ? this.props.columnId: "",
                sortDesc: this.props.initSort ? !this.props.initSort.sortInfo.sortDesc : false
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

    handleSortOrder = (e: any) => {
        // ask the parent for sortInfo
        var sortInfo = this.props.handleSortOrder(e);
        this.displayTheArrows(sortInfo);
        this.setState({
            sortInfo: sortInfo
        });
    };

    componentDidMount(): void {
        if (this.state.sortInfo.sortCol !== "") {
            let theColumnHeader = document.getElementById(this.state.sortInfo.sortCol);
            if (theColumnHeader) {
                theColumnHeader.click();
            }
        }
    }

    displayTheArrows(sortInfo: any) {
        // console.log("displayTheArrows ", sortInfo);
        let allHeaderElements = document.getElementsByClassName(this.props.markerClass);

        Array.from(allHeaderElements)
            .forEach((theElement) => {
                var theClasses = theElement.classList.value.split(/\s+/);
                // console.log("\n------------\ntheParent ", theElement.parentElement?.id,  "\ntheClasses ", theClasses, " sortInfo ", sortInfo )
                if ((theElement.parentElement && theElement.parentElement.id === sortInfo.sortCol)) {
                    if (theClasses.findIndex((aClass) => aClass === this.ARROW_UP) !== -1) {
                        let visIndex = theClasses.findIndex((aClass) => aClass === (!sortInfo.sortDesc ? this.NOT_SEEN : this.SEEN));
                        if (visIndex !== -1) {
                            theClasses[visIndex] = (sortInfo.sortDesc ? this.NOT_SEEN : this.SEEN);
                            theElement.classList.value = theClasses.join(" ");
                        }
                    } else if (theClasses.findIndex((aClass) => aClass === this.ARROW_DOWN) !== -1) {
                        let visIndex = theClasses.findIndex((aClass) => aClass === (!sortInfo.sortDesc ? this.SEEN : this.NOT_SEEN));
                        if (visIndex !== -1) {
                            theClasses[visIndex] = (sortInfo.sortDesc ? this.SEEN : this.NOT_SEEN);
                            theElement.classList.value = theClasses.join(" ");
                        }
                    }
                } else {
                    //console.log("in else ... theParent: ", theElement.parentElement);
                    let visIndex = theClasses.findIndex((aClass) => aClass === this.SEEN);
                    if (visIndex !== -1) {
                        theClasses[visIndex] = this.NOT_SEEN;
                        theElement.classList.value = theClasses.join(" ");
                    }
                }

            });
    }

    render() {
        var sortInfo = this.state.sortInfo;
        let isSortDesc = (sortInfo.sortCol === this.props.columnId && sortInfo.sortDesc);
        return (
            <th id={this.props.columnId} onClick={this.handleSortOrder.bind(this)}>
                {this.props.headerText}&nbsp;
                <span
                    className={(!isSortDesc ? this.ARROW_UP_CLASSES_INIT_SEEN : this.ARROW_UP_CLASSES_INIT_NOT_SEEN) + " " + this.props.markerClass}/>
                <span
                    className={(isSortDesc ? this.ARROW_DOWN_CLASSES_INIT_SEEN : this.ARROW_DOWN_CLASSES_INIT_NOT_SEEN) + " " + this.props.markerClass}/>
            </th>
        );
    }
}

// ========================================
export default ColumnClickDisplay;
