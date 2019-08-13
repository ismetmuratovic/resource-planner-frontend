import React from 'react';
import {Component} from 'react';
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import axios from 'axios';
import ModalPopup from './ModalPopup';

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

class Report extends Component {
    constructor (props){
        super(props);
        this.state={
            //TODO: Works and availabilities year and team specific in REST API
            availabilities: [],
            works:[],
            displayModal: false,
            workerId: 0,
            monthId: 0,
            year: 0
        }
        this.showModal=this.showModal.bind(this);
        this.closeModal=this.closeModal.bind(this);
        this.getData=this.getData.bind(this);
    }

    //Function called for opening ModalPopup component
    showModal(workerId,monthId,year){
        this.setState({
            workerId: workerId,
            monthId: monthId,
            year: year,
            displayModal: true,
            dataLoaded: false
        });
    }

    //Callback function called when ModalPopup is closed
    closeModal(){
        this.setState({
            displayModal: false
        });
    }

    //Get data from REST API
    async getData(){
        axios.get('https://resource-planner-api.herokuapp.com/webapi/availabilities').then(
            res=>{
                this.setState({availabilities:res.data})
            }
        );
        await sleep(1000);
        axios.get('https://resource-planner-api.herokuapp.com/webapi/works').then(
            res=>{
                this.setState({works:res.data})
            }
        );
    }

    //Get number of days worker worked on diferent projects in month
    getDaysWorkedInMonth(workerId,monthId){
        var daysWorked=0;
        this.state.works.forEach(element => {
            if(element.id.workerId===workerId)
            {
                var dateStart=new Date(element.id.dateStart);
                var dateEnd=new Date(element.dateEnd);
                const diffTime = Math.abs(dateEnd.getTime() - dateStart.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if((dateStart.getMonth()+1)===monthId && !isNaN(dateEnd) && dateEnd.getFullYear()===this.props.year) 
                    daysWorked=daysWorked+diffDays;
            }
        });
        return daysWorked;
    }

    //Get number of days worker is available in month
    getDaysAvailableInMonth(workerId,monthId){
        var availableDays=0;

        this.state.availabilities.forEach(element => {
            if(element.id.workerId===workerId){
                var date=new Date(element.id.week);
                if((date.getMonth()+1)===monthId)
                    availableDays=availableDays+element.availableDays;
            }
        });

        return availableDays;        
    }
   
    //Generate monthly percentage for specific worker and month
    generateMonthlyPercentage(workerId,monthId){
        var percentage=0;
        var daysWorked=this.getDaysWorkedInMonth(workerId,monthId);
        var daysAvailable=this.getDaysAvailableInMonth(workerId,monthId);
        
        if(daysAvailable!==0)
            percentage=(daysWorked/daysAvailable)*100;
        else
            percentage=0;
            
        return (<label onClick={()=>this.showModal(workerId,monthId,this.props.year)}>{percentage===0 ? '-' : (Math.round(percentage*100)/100)+'%'}</label>);
    }

    componentDidMount(){
        this.getData();
    }

    render() { 
        //Columns for Report table
        const columns=[
            {
                Header: 'Name',
                accessor: 'firstName'
            },
            {
                Header: 'Jan',
                Cell: props =>{
                   return this.generateMonthlyPercentage(props.original.id,1);
                }
            },
            {
                Header: 'Feb',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,2);
                 }
            },
            {
                Header: 'Mar',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,3);
                 }
            },
            {
                Header: 'Apr',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,4);
                 }
            },
            {
                Header: 'Mai',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,5);
                 }
            },
            {
                Header: 'Jun',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,6);
                 }
            },
            {
                Header: 'Jul',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,7);
                 }
            },
            {
                Header: 'Aug',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,8);
                 }
            },
            {
                Header: 'Sep',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,9);
                 }
            },
            {
                Header: 'Oct',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,10);
                 }
            },
            {
                Header: 'Nov',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,11);
                 }
            },
            {
                Header: 'Dec',
                Cell: props =>{
                    return this.generateMonthlyPercentage(props.original.id,12);
                 }
            }
        ]
        //TODO: No data text for React Table
        return (  
            <div>
                <h1>Team: {this.props.name}</h1>
                <ReactTable columns={columns} data={this.props.workers} defaultPageSize={10}/>
                {this.state.displayModal ? <ModalPopup 
                                                close={this.closeModal} 
                                                reload={this.getData}
                                                workerId={this.state.workerId} 
                                                monthId={this.state.monthId-1}
                                                year={this.state.year}
                                                works={this.state.works}
                                                availabilities={this.state.availabilities}
                                            /> 
                                            : null
                }
            </div>
        );
    }
}
 
export default Report;