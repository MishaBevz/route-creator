import React, {Component} from 'react';
import RoutePoint from '../RoutePoint';
import {YMaps, Map, GeoObject} from 'react-yandex-maps';
import shortid from 'shortid';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './style.css';


export default class RouteForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            routes: [],
            mapState: {
                center: [55.75, 37.57],
                zoom: 9
            },
            multiRouteCoordinates: [],
            dragElems: [],
            routeFormPlaceholder: 'enter point name'
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.updateYmapsElements = this.updateYmapsElements.bind(this);
        
    }
    handleChange(event) {
        this.setState({value: event.target.value})
    }
    onBoundsChange = () => {
        this.setState({
            mapState: {
                center: this.state.map.getCenter()
            }        
        })
    }
    instanceRef = (map) => {
        this.setState({          
            map,
        })
    }
    updateYmapsElements() {
        const ymaps = this.state.ymaps;
        const map = this.state.map
        const multiRouteCoordinates = this.state.multiRouteCoordinates
        const routes = this.state.routes; 
        
        ymaps.ready([
            'Map', 'multiRouter.MultiRoute', 'GeoObjectCollection', 'Polyline', 'GeoObject'
        ])
        .then( () => {   
            map.geoObjects.removeAll()  
            let multiRoute = new ymaps.multiRouter.MultiRoute({
                referencePoints: multiRouteCoordinates
            });    

            map.geoObjects.add(multiRoute);
            for(let i = 0; i < routes.length; i++) {        
                let geoObject = new ymaps.GeoObject({
                    ...routes[i].geoObject.props,                
                }, {
                    preset: 'islands#blackStretchyIcon',
                    draggable: true
                })
                
                map.geoObjects.add(geoObject);
                
                map.geoObjects.events.add('dragend', (e) => {                          
                    const wayPoint = e.get("target");
                    const coords = wayPoint.geometry.getCoordinates();
                    const value = wayPoint.properties._data.balloonContent;
                    map.geoObjects.removeAll() 
                    for(let i = 0; i < routes.length; i++) {
                        if(value === routes[i].value) {                        
                            multiRouteCoordinates[i] = coords            
                            routes[i].geoObject.props.geometry.coordinates = coords;                          
                            this.setState({
                                routes: routes,
                                multiRouteCoordinates: multiRouteCoordinates
                            })
                        }       
                        let geoObject = new ymaps.GeoObject({
                            ...routes[i].geoObject.props            
                        }, {
                            preset: 'islands#blackStretchyIcon',
                            draggable: true
                        })
                        
                        map.geoObjects.add(geoObject);              
                    }
                    
                    let multiRoute = new ymaps.multiRouter.MultiRoute({
                        referencePoints: multiRouteCoordinates
                    });
                    map.geoObjects.add(multiRoute);
                });
            }
        })
    }
    componentDidUpdate(prevProps, prevState) {
        if(this.state.routes !== prevState.routes) {
            console.log('update', this.state.routes)
            this.updateYmapsElements()
        }     
    }
    handleSubmit(event) {
        if(this.state.value.length) {
            let id = shortid.generate();
            let coordinates = this.state.mapState.center;
            let value = [this.state.value];
            this.setState({
                multiRouteCoordinates: [
                    ...this.state.multiRouteCoordinates,
                    coordinates
                ],
            })
            this.setState({
                routes: [
                    ...this.state.routes,
                    {
                    id: id, 
                    value: value,                 
                    geoObject: <GeoObject onClick={this.openBalloon.bind(this, this.state.value, coordinates)} key={id} objects={{openBalloonOnClick: true}} properties={{/* iconContent: value, */  balloonContent: value}} geometry={{ type: "Point", coordinates: this.state.mapState.center}}></GeoObject>,
                    deleteRouteButton: [<button key={id} onClick={this.deleteRoute.bind(this,id)}>x</button>]
                }]      
            })
        }
        this.setState({
            value: ''
        });
        event.preventDefault();
    }
    
    deleteRoute(id, event) {
        const routes = this.state.routes;
        const multiRouteCoordinates = this.state.multiRouteCoordinates;

        routes.forEach((item, index ) => {
            if(id === item.id) {
                routes.splice(index, 1)
                multiRouteCoordinates.splice(index, 1)
                console.log(routes)
                this.setState({
                    routes: routes,
                    multiRouteCoordinates: multiRouteCoordinates
                })    
            }
        })
        this.updateYmapsElements()
        event.preventDefault();
    }
    onDragEnd = result => {
        const { destination, source } = result;

        if(!destination) {
            return
        }
        if(destination.droppableId === source.droppableId && destination.index === source.index){
            return
        }
        
        const newRoutes = this.state.routes;
        const newMultiRouteCoordinates = this.state.multiRouteCoordinates;
        const sourceMultiRouteCoordinate = newMultiRouteCoordinates.splice(source.index, 1);
        newMultiRouteCoordinates.splice(destination.index, 0, sourceMultiRouteCoordinate[0])
        const sourceRouteArr = newRoutes.splice(source.index, 1)
        newRoutes.splice(destination.index, 0, sourceRouteArr[0])

        this.setState({
            ...this.state,
            multiRouteCoordinates: newMultiRouteCoordinates,
            routes: newRoutes
        }) 
        
        this.updateYmapsElements()
        
        
    }
    openBalloon(value, coordinates, event) {
        let balloonCoordinates = [coordinates[0]+0.05, coordinates[1]] 
        event.originalEvent.map.balloon.setData(value)
        event.originalEvent.map.balloon.open(balloonCoordinates)
        
    }

    onApiAvaliable = (ymaps) => {
        this.setState({          
            ymaps,
        })                 
    }
      
    render() {
        const routes = this.state.routes;
        const route = routes.map((route, index) => 
            <Draggable draggableId={route.id} index={index}>
                {provided =>(
                    <li
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}     
                    >
                        <RoutePoint key={route.id} deleteRouteButton={route.deleteRouteButton} route={route.value}/>  
                    </li>
                )}      
            </Draggable>            
        );
        const geoObject = routes.map((route)=> route.geoObject);
        return(
            <div className="route-builder">
                <div className="route-builder__menu">
                    <form onSubmit={this.handleSubmit} className="route-builder__form" id="addRoute">
                        <input type="text" value={this.state.value} onChange={this.handleChange} name="routeName" placeholder={this.routeFormPlaceholder}></input>
                        <button>Add route</button>
                    </form>
                    <DragDropContext onDragEnd = {this.onDragEnd}>
                        <Droppable droppableId={"0"} index={"0"} >  
                            {provided => (
                                <ul  
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {route.length ? route : 'No routes'}
                                    {provided.placeholder}
                                </ul> 
                            )}      
                        </Droppable>  
                    </DragDropContext>  
                </div>
                <YMaps>
                    <div>
                        <div className="yandex-map">
                            <Map   
                                onLoad={this.onApiAvaliable}  
                                defaultState={this.state.mapState} 
                                instanceRef={this.instanceRef}
                                onBoundsChange={this.onBoundsChange}
                                width={"inherit"} height={"inherit"}       
                
                            >
                                {geoObject}
                                
                            </Map> 
                            <div className="yandex-map__center">
                                <div className="top"></div>
                                <div className="bottom"></div>
                                <div className="left"></div>
                                <div className="right"></div>
                            
                            </div>
                        </div>    
                        <div className="yandex-map__text-center">Map center: {JSON.stringify(this.state.mapState.center)}</div>  
                    </div>  
                </YMaps>           
            </div>
        )
    }   
}