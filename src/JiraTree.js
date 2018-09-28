const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const JiraApi = require('jira-client')

class Dependency extends vscode.TreeItem {

	constructor(
		label,
		data,
		children,
		collapsibleState,
		command
	) {
    super(label, collapsibleState);
    this.label = label
    this.children = children
    this.data = data
    this.collapsibleState = collapsibleState
    this.command = command
		this.contextValue = 'issue'
	}

	get tooltip() {
		return this.label
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
	// };



}


class JiraProvider {
	constructor() {
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this.groupings = vscode.workspace.getConfiguration('jiraConfig').get('groupings')
		this.username = vscode.workspace.getConfiguration('jiraConfig').get('username')
		const host = vscode.workspace.getConfiguration('jiraConfig').get('host')
		const password = vscode.workspace.getConfiguration('jiraConfig').get('password')
		if (!host || !password || !this.username) {
			vscode.window.showInformationMessage('You must set the config variables in settings');
		}
		this.jira = new JiraApi({
			host,
			password,
			username: this.username,
			protocol: vscode.workspace.getConfiguration('jiraConfig').get('protocol'),
			apiVersion: vscode.workspace.getConfiguration('jiraConfig').get('apiVersion'),
			strictSSL: vscode.workspace.getConfiguration('jiraConfig').get('strictSSL'),
		})
	}

	refresh(){
		this._onDidChangeTreeData.fire();
	}

	getStories(options = {}) {
    options.fields = [
      'issuetype',
      'created',
      'fixVersions',
      'summary',
      'customfield_13402',
      'customfield_12110',
      'customfield_12107',
      'customfield_13401',
      'customfield_12100',
      'description',
      'issuelinks',
      'reporter',
      'status',
			'labels',
			'team'
    ]
    let query = `assignee = ${this.username} AND status NOT IN (Closed, Resolved) order by updated DESC`
    return this.jira.searchJira(query, options)
  }

	getTreeItem(element) {
		return element
	}

	getChildren(element) {
		if (element) {
			if (element.children.length) {
				return element.children
			}
			return element
		} else {
			return this.getStories().then(({issues}) => {
				return issues.map((iss) => new Dependency(
					`${iss.key} - ${iss.fields.summary}`,
					iss,
					null,
					vscode.TreeItemCollapsibleState.None
				))
			}).then((clean) => {
				return returnDeps(clean, this.groupings)
			})
		}
	}
}

function returnDeps(arr, fields) {
	const [field, ...rest] = fields
	if (!field) {
		return arr
	}
	const map = reduceBy(arr, field)
	// console.log(map)
	return Object.keys(map).map((label) => {
		return new Dependency(
			label,
			null,
			returnDeps(map[label], rest),
			vscode.TreeItemCollapsibleState.Collapsed
		)
	})
}

function reduceBy(issues, groupBy) {
  return issues.reduce((organized, issue) => {
    let field = issue.data.fields[groupBy]
		if (!field) {
			return organized
		}
		const val = field.value || field.name
    if (!organized[val]) {
      organized[val] = []
    }

		organized[val].push(issue)
		return organized
  }, {})
}

exports.JiraProvider = JiraProvider
