import React, { useState } from 'react';
import {Component} from 'react'
import Typography from '@material-ui/core/Typography';

class CurrentPath extends Component {

    render(){
        return(
            <div>
                <Typography>
                  Path:  {this.props.children}
                </Typography>
            
            </div>
        )
    }

}

export default CurrentPath