
import { Project } from '../models/project'
import { File } from '../models/file'
import { TokenWrapper } from '../models/token'

export class ApiClient {

  private base: string
  private token?: string

  constructor(baseUri: string) {
    this.base = baseUri
    this.token = undefined
  }

  private userUri(): string {
    return this.base + "users"
  }
  private projectUri(): string {
    return this.base + "projects"
  }

  public login(user: string, pw: string): Promise<TokenWrapper> {
    // return fetch(this.userUri()+"/login", {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     "Accept": 'application/json'
    //   },
    //   body: JSON.stringify({username: user, password: pw})
    // })
    // .then(res => res.json())
    return Promise.resolve({ token: "abcdef" })
  }

  public projects(): Promise<Project[]> {
    // return fetch(this.projectUri(), {
    //   method: 'GET',
    //   headers: {
    //     'Accept': 'application/json'
    //   }
    // })
    // .then(res => res.json())
    return Promise.resolve([
      { id: "123456", name: "Project 1", owner: "Nico" },
      { id: "23456", name: "Project 2", owner: "Nico" },
      { id: "11-11-b", name: "Project 3", owner: "Nico" }
    ])
  }

  public getFiles(): Promise<File[]> {
    return Promise.resolve([
      { relativePath: "a/b/simple.mo", content: "simple" },
      { relativePath: "factor.mo", content: "function factor end factor;" }
    ])
  }
}

export const defaultClient = new ApiClient(window.location.toString())
