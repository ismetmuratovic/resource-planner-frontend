import React from 'react';
import {Component} from 'react';
import axios from 'axios';
import './Selector.css';
import Report from './Report';

class Selector extends Component {
    constructor(){
        super();
        const year = (new Date()).getFullYear();
        this.years = Array.from(new Array(20),(val, index) => index + year);
        //TODO: hard coded selectedYear
        this.state = {
            reload: false,
            selectedTeamIndex: 0,
            displayReport: false,
            selectedYear: 2019,
            teams: [],
            years: []
         };

         this.handleSelectChange=this.handleSelectChange.bind(this);
         this.showReport=this.showReport.bind(this);
         this.handleYearChange=this.handleYearChange.bind(this);
    }

    addTeams(){
        return this.state.teams.map((tm)=><option key={tm.id}>{tm.name}</option>);
    }

    showReport(){
        this.setState({
            displayReport: true,
        });
    }

    handleSelectChange(event){
        var index = event.nativeEvent.target.selectedIndex;
        this.setState({
            selectedTeamIndex: index
        });
    }
    handleYearChange(event){
        var index = event.nativeEvent.target.selectedIndex;
        this.setState({
            selectedYear: parseInt(event.nativeEvent.target[index].text)
        });
    }

    componentDidMount(){
        axios.get('https://resource-planner-api.herokuapp.com/webapi/teams').then(
            res=>{
                this.setState({teams: res.data})
            }
        );
    }
 
    render() { 
        return (
            <div className="selectorContainer">
                <select onChange={this.handleSelectChange}>
                    {this.addTeams()}
                </select>
                <select onChange={this.handleYearChange}>{
                    this.years.map((year, index) => {
                        return <option key={index} value={year}>{year}</option>
                    })
                }
                </select>
                <button onClick={this.showReport}>Show</button>
                {this.state.displayReport ? <Report 
                    workers={this.state.teams[this.state.selectedTeamIndex].workers} 
                    year={this.state.selectedYear}
                    name={this.state.teams[this.state.selectedTeamIndex].name}
                    /> : null}
            </div>
         );
    }
}
 
export default Selector;