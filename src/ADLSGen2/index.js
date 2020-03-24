import React, { Component } from 'react';
import fetch from 'isomorphic-fetch';
import { adalApiFetch } from '../configAdal';
import Menu from './Menu';
import MenuItem from './MenuItem';
import download from "downloadjs";
import * as API from './API/Gen2';
// import UploadProgress from './UploadProgress';
import "./Index.css";
import CurrentPath from './CurrentPath';
import Typography from "@material-ui/core/Typography";

import {withStyles} from '@material-ui/core/styles';


import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import HomeIcon from '@material-ui/icons/Home';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';

import CircularProgress from '@material-ui/core/CircularProgress';

class ADLSGen2 extends Component {
    state = {
        fileSystems: [],
        isLoading: true
    }

    async componentDidMount() {
        await this.adlsListFileSystems();
    }

    async adlsListFileSystems() {
        this.setState({ isLoading: true });

        const fileSystems = await API.getFileSystems();

        this.setState({
            isLoading: false,
            fileSystems: fileSystems,
            selectedFileSystem: null,
            path: "",
            paths: []
        })

        console.log(this.state)
    }

    async onClickFileSystemDelete(fileSystemName) {
        if (!window.confirm("Are you sure you wish to delete this filesystem?")) {
            return;
        }

        this.setState({ isLoading: true });
        const isSuccess = await API.fileSystemDelete(fileSystemName);
        await this.adlsListFileSystems(); // Reload file systems
        this.setState({ isLoading: false });
    }

    async onClickSelectFileSystem(name) {
        this.setState({ isLoading: true });

        try {
            const fileSystemPaths = await API.getFileSystem(name);

            // fileSystemPaths: [{ etag, isDirectory, lastModified, name }]
            this.setState({
                selectedFileSystem: name,
                paths: fileSystemPaths.sort((a, b) =>
                    ((b.isDirectory == 'true') || false) - ((a.isDirectory == 'true') || false) ||
                    a.name - b.name
                )
            });
        } catch (e) {
            console.log(JSON.parse(e.message));
            alert(e.message);
        }

        this.setState({ isLoading: false });
    }

    async loadPath(goToPath) {
        if (this.state.isLoading) {
            return;
        }

        this.setState({ isLoading: true });

        let newPath = goToPath;

        console.log(`Navigating from ${this.state.path} to ${newPath}`);

        const paths = await API.getFileSystemPath(this.state.selectedFileSystem, newPath);

        // fileSystemPaths: [{ etag, isDirectory, lastModified, name, contentLength }]
        this.setState({
            isLoading: false,
            paths: paths.map((i) => ({
                // name: i.name.replace(newPath + '/', ''),
                name: i.name.split('/').pop(),
                etag: i.etag,
                isDirectory: i.isDirectory || false,
                lastModified: i.lastModified,
                contentLength: i.contentLength || 0
            }))
            .sort((a, b) =>
                ((b.isDirectory == 'true') || false) - ((a.isDirectory == 'true') || false) ||
                a.name - b.name
            ),
            path: newPath
        })

        console.log(this.state)
    }

    //一個上に戻るをクリック
    async onClickNavigatePathUp() {
        const folders = this.state.path.split('/');
        const newPath = folders.slice(0, folders.length - 1).join('/');
        this.loadPath(newPath);
    }

    async onClickNavigatePath(path) {
        const newPath = `${this.state.path}/${path}`;
        this.loadPath(newPath)
    }

    async onClickFileDownload(name) {
        console.log(`Downloading ${this.state.path}/${name}`);
        await API.fileSystemFileDownload(this.state.selectedFileSystem, this.state.path, name);
    }

    async onClickFileDelete(fileName) {
        if (this.state.isLoading) {
            return;
        }

        if (!window.confirm("Are you sure you wish to delete this file?")) {
            return;
        }

        this.setState({ isLoading: true });
        await API.fileSystemFileDelete(this.state.selectedFileSystem, this.state.path, fileName);
        this.setState({ isLoading: false });
        this.loadPath(this.state.path);
    }

    async onClickFolderDelete(folderName) {
        if (this.state.isLoading) {
            return;
        }

        if (!window.confirm("Are you sure you wish to delete this folder?")) {
            return;
        }

        this.setState({ isLoading: true });
        await API.fileSystemFolderDelete(this.state.selectedFileSystem, this.state.path, folderName);
        this.setState({ isLoading: false });
        this.loadPath(this.state.path);
    }

    async onClickFolderCreate() {
        let folderName = prompt("Enter a Folder Name", "MyFolder");
        await API.fileSystemFolderCreate(this.state.selectedFileSystem, this.state.path, folderName);
        this.loadPath(this.state.path);
    }

    async onClickUploadContinue(e) {
        let input = document.querySelector('#adls-upload-file');

        if (!input || !input.files[0] || !input.files[0].name) {
            console.log('No file selected');
            return;
        }

        let inputBlob = input.files[0];
        let inputFileName = input.files[0].name;

        await API.fileSystemFileUpload(this.state.selectedFileSystem, this.state.path, inputFileName, inputBlob, this.cbOnUploadProgress.bind(this));
        this.loadPath(this.state.path);
    }

    async onClickUpload() {
        var input = document.querySelector('#adls-upload-file');
        input.click();
    }

    cbOnUploadProgress(total, current) {
        this.setState({ upload: { total, current} });

        if (total == current) {
            this.setState({ upload: undefined });
        }
    }

    render() {
        if (this.isLoading || !this.state.fileSystems) {
            return (<div>Loading...</div>)
        }

        if (!this.state.selectedFileSystem) {
            return this.renderListFileSystems();
        }

        return this.renderFileSystem();
    }



    renderListFileSystems(){
          return (
            <div className="ADLSGen2">
                <TableContainer component={Paper} className="table">
                    <Table aria-label="File System">
                        <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="left">Size</TableCell>
                            <TableCell align="left">Last Modified</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>

                        <TableRow>
                            <TableCell>
                            <CurrentPath>/</CurrentPath>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                        </TableRow>

                        {this.state.fileSystems.map((i) => (
                            <TableRow key={i.name}>
                            <TableCell component="th" scope="row" display="block">
                               <Typography
                                color="primary"
                                gutterBottom={true}
                                className="folderName"
                                onClick={() => this.onClickSelectFileSystem(i.name)}
                               >
                                <HomeIcon color="primary" className="materialIcon"/>

                                
                                    
                                   {i.name}
                                </Typography>
                            </TableCell>
                            <TableCell>--</TableCell>
                            <TableCell>--</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>


        );
    }

    renderFileSystem() {
        return (
            <div className="ADLSGen2">
                <input type="file" id="adls-upload-file" style={{ display: 'none' }} onChange={(e) => this.onClickUploadContinue(e)} />




                {/* Menu */}
                {/* <Menu>
                    <MenuItem name="Create Folder" onClick={() => this.onClickFolderCreate()} />
                    {!this.state.upload && <MenuItem name="Upload" onClick={() => this.onClickUpload()} />}
                    {this.state.upload &&  <CircularProgress variant="determinate" value={Math.round(this.state.upload.current / this.state.upload.total * 100)} />}

                </Menu> */}


                <TableContainer component={Paper}>
                <Table aria-label="File System">
                    <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="left">Size</TableCell>
                        <TableCell align="left">Last Modified</TableCell>
                    </TableRow>
                    </TableHead>

                    <TableBody>



                    {/* Folder up or Filesystem list */}
                    {
                    this.state.path == "" ?
                        <TableRow key="folderUp"　>
                        <TableCell component="th" scope="row">
                            <Typography
                                onClick={() => this.adlsListFileSystems()}
                                className="folderName"
                            >
                                <ArrowBackIosIcon className="materialIcon"/>

                                <CurrentPath>
                                {this.state.path=="" ? this.state.selectedFileSystem : this.state.selectedFileSystem + this.state.path}
                            </CurrentPath>
                            </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        </TableRow>
                        :
                        <TableRow key="folderUp"　>
                            
                        <TableCell component="th" scope="row">
                        <Typography onClick={() => this.onClickNavigatePathUp() } className="folderName">
                        <ArrowBackIosIcon className="materialIcon"/>
                        <CurrentPath>
                                {this.state.path=="" ? this.state.selectedFileSystem : this.state.selectedFileSystem + this.state.path}
                            </CurrentPath>
                        </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        </TableRow>
                    }

                    {this.state.paths.map((i) => (

                        (i.isDirectory) ?
                            <TableRow key={i.name}>
                            <TableCell component="th" scope="row"  >
                                <Typography
                                    margin="auto"
                                    color="primary"
                                    onClick={() => this.onClickNavigatePath(i.name)}
                                    className="folderName"
                                >
                                    <FolderOpenIcon className="materialIcon"/>
                                {i.name}
                                </Typography>
                            </TableCell>
                            <TableCell align="left">--</TableCell>
                            <TableCell align="left">{i.lastModified}</TableCell>
                            </TableRow>
                            :
                            <TableRow key={i.name}>
                            <TableCell component="th" scope="row" onClick={() => console.log('is file')}  >
                            {i.name}
                            </TableCell>
                            <TableCell align="left">{Math.round(i.contentLength / 1024 /1024 *100 ) /100} MB</TableCell>
                            <TableCell align="left">{i.lastModified}</TableCell>
                            </TableRow>

                    ))}
                    </TableBody>
                </Table>
                </TableContainer>

            </div>

        );
    }
}

export default ADLSGen2;
