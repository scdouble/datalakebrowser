import React, { Component } from 'react';
import AppBar from "@material-ui/core/AppBar";
import { withStyles } from "@material-ui/core/styles";

import Toolbar from "@material-ui/core/Toolbar";
import { Divider } from '@material-ui/core';
import Typography from "@material-ui/core/Typography";

const Header = ({ classes }) => {

    return(
        <div className={classes.root}>
        <AppBar>
            <Toolbar>
            <div className={classes.grow} >
                <Typography component="h1" variant="h6" color="inherit" noWrap>
                Data Lake Browser
                </Typography>
            </div>
            </Toolbar>
        </AppBar>
        </div>
    )
}

const styles = ({
    root: {
      flexGrow: 1
    },
    grow: {
      flexGrow: 1,
      display: "flex",
      alignItems: "center",
    }
})

export default withStyles(styles)(Header);