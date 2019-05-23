import React from 'react'
import { Col, Row, ListGroup, Nav, SplitButton, ButtonGroup, Button, Modal, Form, Alert, Badge, Dropdown } from 'react-bootstrap'
//@ts-ignore
import Octicon from 'react-octicon'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { File, FileNode, AppState, CompilerError, Project } from '../models/index'
import { newFile, setSessionFiles, Action } from '../redux/index'
import { ApiClient } from '../services/api-client';
import { renderErrors } from '../partials/errors'
import Dropzone from 'react-dropzone'
//@ts-ignore
import { Treebeard, decorators } from 'react-treebeard';
import { TreeView } from './tree-view';

interface Props {
  api: ApiClient
  files: File[]
  project: Project
  activeFile?: File
  compilerErrors: CompilerError[]
  newFile(f: File): Action
  setSessionFiles(f:File[]): Action
  onFileClicked(f: File): void
  onSaveClicked(): void
  onCompileClicked(): void
}

interface State {
  showNewFileDialog: boolean
  showUploadDialog: boolean
  fileToRename?: File
  errors: string[]
}

class FileViewCon extends React.Component<Props, State> {
  private newFilename?: string = undefined

  private readonly api: ApiClient
  private readonly fileTypes = [
    "Model", "Function", "Connector", "Class"
  ]
  private selectedType: string = this.fileTypes[0]

  constructor(props: any) {
    super(props)
    this.api = this.props.api
    this.state = { showNewFileDialog: false, showUploadDialog: false, errors: [] }
  }

  private updateErrors(err: string[]) {
    this.setState({ showNewFileDialog: !R.isEmpty(err), errors: err })
  }
  private fileExists(name: string): Boolean {
    const paths = this.props.files.map(f => f.relativePath)
    return R.any(p => p == name, paths)
  }

  private createNewFile(ev:any) {
    ev.preventDefault()
    const extractModelname = (path: string) => {
      //the "model" name is the last part after / or . ;) (my/awesome/Class)
      const m = path.match(/[\.\/]?(\w+)$/)
      return (m) ? m[1] : ""
    }
    const createFilename = (path: string) => path.replace(/\./g, "/") + ".mo"

    if (this.selectedType && this.newFilename && !R.contains(" ", this.newFilename) && !this.fileExists(this.newFilename)) {
      const suffixStripped = this.newFilename!.endsWith(".mo") ? this.newFilename!.substring(0, this.newFilename!.length - 3).trim() : this.newFilename!.trim()
      const tpe = this.selectedType!.toLowerCase()
      const name = extractModelname(suffixStripped)
      const path = createFilename(suffixStripped)
      const content = `${tpe} ${name}\nend ${name};`
      this.api
        .updateFile({ relativePath: path, content: content })
        .then(this.props.newFile)
        .then(() => this.updateErrors([]))
        .catch(er => this.updateErrors(["Creation failed because of: " + er]))
    } else {
      this.updateErrors([
        "The file needs a type and a name!",
        "The filename can't contain spaces!",
        "The file shouldn't already exists!"])
    }
  }

  private deleteFile(f:File) {
    this.props.api.deleteFile(f)
      .then(() =>
        this.props.setSessionFiles(this.props.files.filter(oldF => oldF.relativePath != f.relativePath))
      )
  }

  private newFileDialog() {
    const handleClose = () => {
      console.log("close: ", this.state)
      if (R.isEmpty(this.state.errors))
        this.setState({ showNewFileDialog: false })
    }
    const handleFilenameChange = (ev: any) => this.newFilename = ev.target.value
    const handleFileTypeSelect = (tpe: string) => this.selectedType = tpe

    return (
      <Modal show={this.state.showNewFileDialog} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create a new file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={this.createNewFile.bind(this)}>
            <Form.Group>
              <Form.Label>Filename</Form.Label>
              <Form.Control type="text" size="lg" placeholder="my.package.awesome-file.mo" onChange={handleFilenameChange} />
            </Form.Group>
            <Form.Group controlId="formModeltype">
              <Form.Label>Type</Form.Label>
              <Form.Control as="select">
                {this.fileTypes.map(tpe => <option key={tpe} onClick={() => handleFileTypeSelect(tpe)}>{tpe}</option>)}
              </Form.Control>
            </Form.Group>
            <Button variant="success" type="submit" >Create</Button>
          </Form>
          {renderErrors(this.state.errors)}
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal >)
  }

  private uploadArchive(files: any[]) {
    console.log("uploading..", files)
    const promises = files.map(f => this.api.uploadArchive(f))
    //await all uploads and use last-finished to update session files
    Promise.all(promises)
      .then(results => results[results.length-1])
      .then(files => this.props.setSessionFiles(files))
      .then(() => this.setState({showUploadDialog: false}))
  }

  private uploadDialog() {
    const handleClose = () => {
      console.log("close: ", this.state)
      if (R.isEmpty(this.state.errors))
        this.setState({ showUploadDialog: false })
    }

    return (
      <Modal show={this.state.showUploadDialog} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Upload archive</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Dropzone onDrop={this.uploadArchive.bind(this)} accept=".zip">
            {({ getRootProps, getInputProps }) => (
              <section className="card bg-light">
                <div className="card-body" {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p className="card-text">Drag 'n' drop a zip archive here, or click to select one.</p>
                </div>
              </section>
            )}
          </Dropzone>
        </Modal.Body>
      </Modal>
    )
  }

  private renameFile(f:File, name:string) {
    if(R.isEmpty(name) || R.contains(" ", name)) {
      this.updateErrors([
        "The filename can't contain spaces!",
        "The filename can't be empty!"
      ])
    } else {
      this.props.api.renameFile(f, name)
        .then(newFile => {
          const otherFiles = this.props.files.filter(other => other.relativePath != f.relativePath)
          this.props.setSessionFiles(R.append(newFile, otherFiles))
          this.setState({ fileToRename: undefined })
        })
    }
  }

  private renameDialog() {
    const handleClose = () => {
      console.log("close: ", this.state)
      if (R.isEmpty(this.state.errors))
        this.setState({ fileToRename: undefined })
    }
    let newFilename:string = ""
    const handleFilenameChange = (ev:any) => newFilename = ev.target.value
    return (
      <Modal show={this.state.fileToRename!==undefined} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Rename file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(ev:any) => {ev.preventDefault(); this.renameFile(this.state.fileToRename!, newFilename)} }>
            <Form.Group>
              <Form.Label>Filename</Form.Label>
              <Form.Control type="text" size="lg" defaultValue={this.state.fileToRename && this.state.fileToRename!.relativePath} onChange={handleFilenameChange} />
            </Form.Group>
            <Button variant="success" type="submit">Rename</Button>
          </Form>
        </Modal.Body>
      </Modal>
    )
  }

  render() {
    const tree: FileNode = {
      name: "project",
      toggled: true,
      children: [
        {
          "name": "a",
          "children": [
            {
              "name": "square.mo",
              file: { relativePath: "a/sqaure.mo", content: "blup" }
            }
          ]
        },
        {
          "name": "test",
          "children": [
            {
              "name": "fac.mo",
              file: {relativePath: "test/fac.mo", content: "blup"}
            }
          ]
        },
        {
          "name": "BouncingBall.mo",
          file: {relativePath: "BouncingBall.mo", content: "blup"}
        }]
    }

    const files = this.props.files
    const fileClicked = this.props.onFileClicked
    const errorsInFile = (f: File) => this.props.compilerErrors.filter(e => e.file == f.relativePath)
    const newFileClicked = () => { this.setState({ showNewFileDialog: true }) }
    const uploadArchiveClicked = () => { this.setState({showUploadDialog: true}) }
    const renameFileClicked = (f:File) => this.setState({fileToRename: f})

    return (<>
        <h5 className="text-secondary">Actions</h5>
        <ButtonGroup vertical className="full-width">
          <Button variant="outline-success" onClick={this.props.onSaveClicked}><Octicon name="check" /> Save</Button>
          <Button variant="outline-primary" onClick={newFileClicked}><Octicon name="plus" /> New File</Button>
          <Button variant="outline-primary" onClick={uploadArchiveClicked}><Octicon name="cloud-upload" /> Upload Archive</Button>
          <Button variant="outline-primary" href={this.props.api.projectDownloadUrl(this.props.project.id)}><Octicon name="cloud-download" /> Download Archive</Button>
          <Button variant="outline-primary" onClick={this.props.onCompileClicked}><Octicon name="gear" /> Compile</Button>
        </ButtonGroup>
        <h5 className="text-secondary">Files</h5>
        <TreeView
          tree={tree}
          deleteFile={this.deleteFile.bind(this)}
          renameFile={renameFileClicked}
          />
      {this.newFileDialog()}
      {this.uploadDialog()}
      {this.renameDialog()}
    </>
    )
  }
}

function mapProps(state: AppState) {
  return {
    files: state.session!.files,
    project: state.session!.project,
    compilerErrors: state.session!.compilerErrors
  }
}

function dispatchToProps(dispatch: (a: Action) => any) {
  return bindActionCreators({ newFile, setSessionFiles}, dispatch)
}
const FileView = connect(mapProps, dispatchToProps)(FileViewCon)
export default FileView
