import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { AppBar, Button, FormGroup, Grid, makeStyles, Paper, Toolbar, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
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

function App() {

  const [state, setState] = useState({selectedFiles: []});

  function onFileChange(files: any){
    console.log(files)
  }


  const classes = useStyles();

  return (
    <div className="App">
      <AppBar position="absolute" color="default" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap>
            SAPIENTA
          </Typography>
        </Toolbar>
      </AppBar>

      <main className={classes.layout}>
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h5" align="center">
            Annotate Papers
          </Typography>

          <p>Please select one or more scientific papers to annotate.</p>

          <FormGroup>
            <input style={{ display: 'none' }} id="upload-button-file" multiple type="file" onChange={onFileChange} />
            <label htmlFor="upload-button-file">
              <Button component="span" color="primary">
                Select File(s)
              </Button>
            </label>
          </FormGroup>
        </Paper>
      </main>

    </div>
  );
}

export default App;
