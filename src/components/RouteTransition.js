import React, { Component, PropTypes } from 'react'
import ReactTransitionGroup from 'react-addons-transition-group'

export default class EasyTransition extends Component {
    state = {
        visible: true
    };
    static propTypes = {
        path: PropTypes.string.isRequired,
        initialStyle: PropTypes.object.isRequired,
        transition: PropTypes.string.isRequired,
        finalStyle: PropTypes.object.isRequired,
        leaveStyle: PropTypes.object
    };
    componentWillReceiveProps(nextProps) {
        this.setState({
            visible: (this.props.path === nextProps.path || (typeof this.props.path === 'undefined'))
        })
    }
    childDidLeave() {
        this.setState({
            visible: true
        })
    }
    render() {
        return (
            <ReactTransitionGroup transitionName="fade" component="div">
                {this.state.visible &&
                <TransitionChild key={this.props.path} childDidLeave={this.childDidLeave.bind(this)} {...this.props}>
                    {this.props.children}
                </TransitionChild>}
            </ReactTransitionGroup>
        )
    }
}

class TransitionChild extends Component {
    componentDidAppear() {
        this.componentFadeIn()
    }
    componentWillEnter(callback) {
        this.componentFadeIn(callback)
    }
    componentFadeIn(callback) {
        Object.assign(this.page.style, this.props.initialStyle)
        Object.keys(this.props.initialStyle).forEach(property => window.getComputedStyle(this.page)[property])
        this.page.style.transition = this.props.transition
        Object.assign(this.page.style, this.props.finalStyle)
        let x = (event) => {
            callback && callback();
            this.page.removeEventListener("transitionend", x);
        };
        this.page.addEventListener("transitionend", x, false);
    }
    componentWillLeave(callback) {
        let leaveStyle = this.props.leaveStyle ? this.props.leaveStyle : this.props.initialStyle
        Object.assign(this.page.style, leaveStyle)
        let x = (event) => {
            callback()
            this.props.childDidLeave()
            this.page.removeEventListener("transitionend", x);
        };

        this.page.addEventListener("transitionend", x, false);
    }
    render() {
        return <div ref={(ref) => ref && (this.page = ref)} style={this.props.initialStyle}>
            {this.props.children}
        </div>
    }
}