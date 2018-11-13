import React, {Component} from 'react';
import './style.css';

export default class RoutePoint extends Component {
    constructor(props) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        const {route, deleteRouteButton} = this.props
        return(
            <div className="route">
                <div>{route}</div>
                {deleteRouteButton}
            </div>
        )
    }
}