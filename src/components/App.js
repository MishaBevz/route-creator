import React, {Component} from 'react';
import RouteForm from './RouteForm';
import './style.css';
import markerLogo from './marker.png';

export default class App extends Component { 
    render() {    
        return(
            <div className="content">
                <div className="content__title">
                    <h1>Route creator</h1>  
                    <img className="content__logo" src={markerLogo}></img>
                </div>
                <RouteForm/>                                                 
            </div>
        )    
    }   
}


