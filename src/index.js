// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path')
const { JiraProvider } = require('./JiraTree')
const shell = require('shelljs')
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  shell.cd(vscode.workspace.rootPath)

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "jira-vscode" is now active!');

  const jiraProvider = new JiraProvider();

  vscode.window.registerTreeDataProvider('my-tickets', jiraProvider);

  vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));

  vscode.commands.registerCommand('jira-tree.openInJira', function (element) {
    // The code you place here will be executed every time your command is executed
    const proto = vscode.workspace.getConfiguration('jiraConfig').get('protocol')
    const host = vscode.workspace.getConfiguration('jiraConfig').get('host')
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${proto}://${host}/browse/${element.data.key}`))
    // Display a message box to the user
  });

  vscode.commands.registerCommand('jira-tree.createFeatureBranch', function (element) {
    const prefix = vscode.workspace.getConfiguration('jiraConfig').get('branchPrefix') ||
      vscode.workspace.getConfiguration('jiraConfig').get('username')
    const branch = path.join(prefix, element.data.fields.issuetype.name, element.data.key)
    let commands = [
      `git checkout master`,
      `git pull origin master`,
      `git checkout -b ${branch}`
    ]

    commands.map((command) => shell.exec(command))
  });

  // context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;