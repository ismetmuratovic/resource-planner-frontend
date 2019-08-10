import React from 'react';
import {Component} from 'react';
import Modal from 'react-modal';
import ReactTable from 'react-table';
import axios from 'axios';

//Custom style for Modal
const customStyles = {
    content : {
        width: "50%",
        margin: "0 auto",
        height: "70%"
    }
  };

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//Storing changes in works and availabilities tables 
var updatedWorks=[];
var updatedAvailabilities=[];

class ModalPopup extends Component {
    constructor(props){
        super(props);
        
        this.state={
            modalIsOpen: true,
            worker: {},
            months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
            updatedWorks: [],
        }
    
        this.openModal=this.openModal.bind(this);
        this.closeModal=this.closeModal.bind(this);
        this.updateWokr=this.updateWokr.bind(this);
        this.putDataIntoDatabase=this.putDataIntoDatabase.bind(this);
    }

    //Function called when modal is opened
    openModal() {
        this.setState({modalIsOpen: true});
    }
     
    //Function called when modal is closed calls 2 functions passed as props from Report commponent in order to get reload report with new values from database
    closeModal() {
        this.setState({modalIsOpen: false});
        if(updatedWorks.length!==0 || updatedAvailabilities.length!==0){
            this.props.reload();
        }
        updatedWorks=[];
        updatedAvailabilities=[];
        updatedWorks.length=0;
        updatedAvailabilities.length=0;
        this.props.close();
    }

    //Generate monday dates for specific month and year
    getWeekDates(monthId,year){
        var date = new Date(Date.UTC(year, monthId, 1));
        var weeks = [];

        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }

        while (date.getMonth() === monthId) {
            weeks.push(new Date(date));
            date.setDate(date.getDate() + 7);
        }
        return weeks;
    }

    //Gets number of days worker worked on specific project in week
    getNumberOfDaysWorked(projectId,week,cellInfo){
        var daysWorked=0;
        this.getWorkData().forEach(element => {
            var d1=new Date(element.id.dateStart);
            var d2=new Date(week);
            if(element.id.projectId===projectId && d1.getDate()===d2.getDate()){
                if(element.dateEnd){
                    var date_start=new Date(element.id.dateStart); 
                    var date_end=new Date(element.dateEnd);
                    const diffTime = Math.abs(date_start.getTime() - date_end.getTime());
                    daysWorked = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }   
            }
        });
        return (
            <div
                style={{ backgroundColor: "#fafafa",textAlign: "center"}}
                contentEditable
                suppressContentEditableWarning
                //TODO: Fix double entries (When cell is edited twice but value did not change)
                onBlur={e => {
                    if(e.target.innerHTML!==daysWorked.toString()){
                        this.updateWokr(cellInfo,e.target.innerHTML);
                    }
              }}
              dangerouslySetInnerHTML={{
                __html: daysWorked
              }}
            />
          );
    }

    //Gets number of days worker is available in specific week
    getNumberOfDaysAvailable(week){
        var daysAvailable=0;
        this.props.availabilities.forEach(element => {
            var d1=new Date(element.id.week);
            var d2=new Date(week);
            if(d1.getDate()===d2.getDate() && element.id.workerId===this.state.worker.id && d1.getMonth()===this.props.monthId){
                daysAvailable=element.availableDays;
            }
                
        });

        return (
            <div
                style={{ backgroundColor: "#fafafa",textAlign: "center"}}
                contentEditable
                suppressContentEditableWarning
                //TODO: Fix double entries (When cell is edited twice but value did not change)
                onBlur={e => {
                    if(e.target.innerHTML!==daysAvailable.toString()){
                        this.updateAvailability(parseInt(e.target.innerHTML),week);
                    }
              }}
              dangerouslySetInnerHTML={{
                __html: daysAvailable
              }}
            />
        );
      
    }

    //Adds updated availability to array 
    updateAvailability(daysAvailable,week){
        var updatedAvailability={
            availableDays: daysAvailable,
            id: {
                week: week,
                workerId: this.state.worker.id
            }
        };
        updatedAvailabilities.push(updatedAvailability);
    }

    //Ads updated work to array
    updateWokr(cellInfo,daysWorked){
        var updated_work=JSON.parse(JSON.stringify(cellInfo.original));
        var date_end=new Date(cellInfo.column.id);
        var date_start=new Date(cellInfo.column.id);
        date_end.setDate(date_end.getDate()+parseInt(daysWorked));
        updated_work.dateEnd=date_end.toISOString();
        updated_work.id.dateStart=date_start.toISOString();
        updatedWorks.push(updated_work);
    }

    //Puts data in updatedWorks and updatedAvailabilities array into database
    putDataIntoDatabase(){
        updatedWorks.forEach(async element =>{
            await sleep(500);
            axios.put("https://resource-planner-api.herokuapp.com/webapi/works",element);
           
        });
        updatedAvailabilities.forEach(async element => {
            await sleep(500);
            axios.put("https://resource-planner-api.herokuapp.com/webapi/availabilities",element);
        });
    }

    //Get columns with week dates for work table
    getWorkTableColumns(monthId,year){
        var weeks=this.getWeekDates(monthId,year);
        var columns=[];
        columns= weeks.map((week)=>{
            return {
                id: week.toISOString(),
                Header : week.getDate()+'.'+(monthId+1),
                Cell: props=>{return this.getNumberOfDaysWorked(props.original.id.projectId,props.column.id,props);}
            };
        });
        columns.unshift({Header:'Project(s)',accessor: 'project.name'});
        return columns;
    }

    //Get columns with week dates for availability table
    getAvailabilityTableColumns(monthId,year){
        var weeks=this.getWeekDates(monthId,year);
        var columns=[];
        columns= weeks.map((week)=>{
            return {
                id: week.toISOString(),
                Header : week.getDate()+'.'+(monthId+1),
                Cell: props=>{return this.getNumberOfDaysAvailable(props.column.id);}

            };
        });
        columns.unshift({Header:'',accessor: 'name'});
        return columns;
    }

    //Gets and filters data for work table
    getWorkTabelData(){
       //Filters only unique objects in data array
       const unique=[];
       const map=new Map();
       for(const item of this.getWorkData()){
           if(!map.has(item.id.projectId)){
                map.set(item.id.projectId,true);
                unique.push(item);
            }
       }
       return unique;
    }

    //Gets and filters all works
    getWorkData(){
        //Filters data by worker id and month
       const data=this.props.works.filter((v,i,a)=>{
            return v.id.workerId===this.props.workerId && (new Date(v.id.dateStart).getMonth()===this.props.monthId);
       });

       return data;
    }

    componentDidMount(){
        axios.get('https://resource-planner-api.herokuapp.com/webapi/workers/'+this.props.workerId).then(
            (res)=>{
                this.setState({worker: res.data})
            }
        );
    }

    render() { 
        return ( 
        <div>
            <Modal
                isOpen={this.state.modalIsOpen}
                onRequestClose={this.closeModal}
                contentLabel='ModalPopup'
                ariaHideApp={false}
                style={customStyles}
                >
                <h3>{this.state.months[this.props.monthId]+' '+this.props.year+' ('+this.state.worker.firstName+' '+this.state.worker.lastName+')'}</h3>
                <ReactTable columns={this.getWorkTableColumns(this.props.monthId,this.props.year)} data={this.getWorkTabelData()}  defaultPageSize={5}/>   
                <h3>Weekly availability</h3>
                <ReactTable columns={this.getAvailabilityTableColumns(this.props.monthId,this.props.year)} data={[{name: 'Available days'}]} showPagination={false} defaultPageSize={1}/>
                <button onClick={this.putDataIntoDatabase}>Save</button>
                <button onClick={this.closeModal}>Close</button>
                </Modal>
        </div> );
    }
}
 
export default ModalPopup;