import React, { ChangeEvent, useState } from 'react';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import { Button, CircularProgress, FormGroup, Grid, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { IconButton, LinearProgress } from '@material-ui/core';
import axios, { AxiosResponse } from 'axios';
import { Download as DownloadIcon } from '@mui/icons-material';

const useStyles : any = makeStyles((theme: any) => ({
  appBar: {
    position: 'relative',
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
  },
}));

class AppState{
  selectedFiles?: Array<File>
  fileStates: Array<string>
  isProcessing: boolean
  id2Offset: Map<string, number>
  offset2Id: Map<number, string>

  constructor(){
    this.fileStates = [];
    this.isProcessing = false;
    this.id2Offset = new Map();
    this.offset2Id = new Map();
  }
}

interface SapientaEvent {
  step: string
  status: string
  job_id: string
}


function App() {

  const [state, setState] = useState(new AppState());

  const apiRoot = (window.location.host === "localhost:3000") ? "localhost:8000" : window.location.host;

  const protocol = window.location.protocol === "http:" ? "ws:" : "wss:";

  const ws = new WebSocket(`${protocol}//${apiRoot}/ws`);

  ws.onmessage = (msg) => {
    let evt: SapientaEvent = JSON.parse(msg.data);
    console.log(evt);


    let newStatus = "";
    

    if ((evt.step === "convert_pdf") && (evt.status==="complete")){
      newStatus = "Splitting Sentences";
    }

    else if ((evt.step === "split") && (evt.status==="complete")){
      newStatus = "Annotating Sentences";
    }

    else if ((evt.step === "annotate") && (evt.status==="complete")){
      newStatus = "Complete";
    }


    let offset = state.id2Offset.get(evt.job_id);

    if (offset !== undefined) {
      state.fileStates[offset] = newStatus;

      var stillProcessing = false;

      for(var i=0; i < state.fileStates.length; i++){
        if (state.fileStates[i] !== "Complete"){
          stillProcessing = true;
        }
      }

      state.isProcessing = stillProcessing;

      setState({...state})
    }
  }
  
  function onFileChange(event: ChangeEvent<HTMLInputElement>){
    if (event.target.files !== null){
      var selectedFiles = [];
      var fileStates = [];

      for(var i=0; i<event.target.files.length; i++){
        const file = event.target.files.item(i);

        if (file !== null){
          selectedFiles.push(file);
          fileStates.push("Pending");
        }

      }

      state.selectedFiles = selectedFiles;
      setState({...state, selectedFiles: selectedFiles, fileStates: fileStates});
    }
  }

  async function processPDF(fileObj: File, fileOffset: number) {
    var formData = new FormData();
    formData.append("file", fileObj)

    state.fileStates[fileOffset] = "Uploading";
    setState({...state, fileStates:state.fileStates});

    let uploadResult: AxiosResponse<any> = await axios.post(`//${apiRoot}/submit`, formData,{
      headers: {"Content-Type": "multipart/form-data"}
    });

    state.fileStates[fileOffset] = "Processing...";
    state.id2Offset.set(uploadResult.data["job_id"], fileOffset);
    state.offset2Id.set(fileOffset, uploadResult.data["job_id"]);

    setState({...state});

    ws.send(JSON.stringify({"action":"subscribe", "job_id":uploadResult.data["job_id"]}))
  
  }

  async function onUploadFiles(event: React.MouseEvent<HTMLButtonElement>) {

      if(!state.selectedFiles){
        return;
      }

      state.isProcessing = true;

    
      setState({...state});

      for(var i=0; i<state.selectedFiles?.length; i++){

          if (state.selectedFiles[i] != null){
            
            try{
              await processPDF(state.selectedFiles[i], i);
            }catch{
              state.fileStates[i] = "Failed";
              setState({...state, fileStates:state.fileStates});
              continue;
            }
            

          }
          
      }
  }


  const classes = useStyles();

  function getSecondaryAction(fileOffset: number) {
    
    if (state.isProcessing && state.fileStates[fileOffset] !== "Complete"){
      return (<CircularProgress></CircularProgress>)
    } else if (state.fileStates[fileOffset] === "Complete") {
      return (<IconButton edge="end" 
        aria-label="download" 
        onClick={()=>{window.open(`//${apiRoot}/${state.offset2Id.get(fileOffset)}/result`, "_blank")}}>
           <DownloadIcon /> 
      </IconButton>)
    }

  }

  return (
    <div className="App">

      <main className={classes.layout}>
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h5" align="center">
            SAPIENTA: Annotate Papers
          </Typography>

          

          {(state.isProcessing ? <p>Processing...<LinearProgress/></p> : <p>Please select one or more scientific papers to annotate.</p>)}

          <p>&nbsp;</p>

          <FormGroup>
            <input disabled={state.isProcessing} style={{ display: 'none' }} id="upload-button-file" multiple type="file" onChange={onFileChange} />
            <label htmlFor="upload-button-file">
              <Button component="span" variant="contained" color="primary" disabled={state.isProcessing}>
                Select File(s)
              </Button>
            </label>            
          </FormGroup>

          {(state.selectedFiles != null && state.selectedFiles.length > 0)  ? (
            <Grid>
            <List style={{width: "100%"}}>
              {state.selectedFiles?.map((file, idx) => (
                <ListItem key={idx} secondaryAction={getSecondaryAction(idx)}>
                  <ListItemAvatar> <DescriptionIcon/> </ListItemAvatar>
                  <ListItemText style={{width:"80%"}} primary={file?.name} secondary={state.fileStates[idx]}></ListItemText>
                </ListItem>
              ) )}
            </List>
            <Button disabled={state.isProcessing} color="secondary" variant="contained" onClick={onUploadFiles}>Process Files</Button>
            </Grid>
          ) : "" }
        </Paper>
      </main>

    </div>
  );
}

export default App;
