var app = require('app');
var ipc = require('ipc');
var path = require('path');
var fs = require('fs');
var dialog = require('dialog');
var ADCConfigurator = require('adcutil').Configurator;
var workspace = require('./workspaceModel.js');
var servers   = require('../modules/servers/adxServers.js');
var workspaceView;

/**
 * Save the status of the workspace
 */
function saveWorkspaceStatus() {
    var adc = global.project.adc;
    if (!adc || !adc.path) {
        return;
    }

    fs.mkdir(path.join(adc.path, '.adxstudio'), function () {
        fs.writeFile(path.join(adc.path, '.adxstudio', 'workspace.json'),  JSON.stringify(workspace.toJSON()), {encoding: 'utf8'});
    });
}

/**
 * Try to execute the function if the project is an ADC
 * @param {Function} fn
 * @param {ADC} fn.adc Instance of the ADC
 */
function tryIfADC(fn) {
    var adc = global.project.adc;
    if (!adc || !adc.path) {
        return;
    }

    adc.load(function (err) {
        if (err) {
            return;
        }
        if (!adc.configurator) {
            return;
        }
        if (!adc.configurator.info) {
            return;
        }

        var info = adc.configurator.info.get();
        if (!info || !info.name || !info.guid) {
            return;
        }
        // Ok seems to be an ADC
        fn(adc);
    });
}

/**
 * Open project in the workspace
 */
function openProject() {
    workspace.removeListener('change', saveWorkspaceStatus);

    // Load the default path
    fs.readFile(path.join(global.project.path || '', '.adxstudio', 'workspace.json'), function (err, data) {
        var json = err ? {} : JSON.parse(data.toString());
        workspace.init(json, function () {
            // Reload the workspace as it where before leaving the application
            var adc = global.project.adc,
                currentTabIds = {
                    main   : workspace.panes.main.currentTabId,
                    second : workspace.panes.second.currentTabId
                };

            // Copy the tabs before to iterate through it
            // the tabs could be modified by another async event
            // .slice() ensure we are working on a static copy
            workspace.tabs.slice().forEach(function loadTab(tab) {
                var pane = workspace.where(tab);
                var action = tab.id === currentTabIds[pane] ? 'workspace-create-and-focus-tab' : 'workspace-create-tab';

                switch (tab.type) {
                    // Open the preview
                    case 'preview':
                        if (adc) {
                            servers.listen(function (options) {
                                tab.name = 'Preview';
                                tab.ports     = {
                                    http : options.httpPort,
                                    ws   : options.wsPort
                                };
                                workspaceView.send(action, err, tab, workspace.where(tab));
                            });
                        }
                        break;

                    // Open the project settings
                    case 'projectSettings':
                        if (adc) {
                            getResourcesDirectoryStructure(function (structure) {
                                adc.load(function (er) {
                                    tab.adcConfig = (!er)  ? adc.configurator.get() : {};
                                    tab.adcStructure = structure;
                                    workspaceView.send(action, er, tab, pane);
                                });
                            });
                        }
                        break;

                    // Open file by default
                    case 'file':
                    default:
                        tab.loadFile(function (er) {
                            if (!er) {
                                workspaceView.send(action, er, tab, workspace.where(tab));
                            }
                        });
                        break;
                }
            });

            // Listen change now
            workspace.on('change', saveWorkspaceStatus);
        });
    });
}

/**
 * Reload the workspace
 */
function reloadWorkspace() {
    workspaceView.reload();
}

/**
 * Open a file in new tab. If the file is already open, focus the tab.
 *
 * @param {String} file Path of file to open
 */
function openFile(file) {
    workspace.find(file, function (err, tab, pane) {

        // If the tab already exist only focus it
        if (tab) {
            // TODO::Look if the content of the tab has changed
            // TODO::Look if the file has been removed
            workspaceView.send('workspace-focus-tab', err, tab, pane);
            return;
        }

        // When the tab doesn't exist, create it
        workspace.createTab(file, function (err, tab, pane) {
            if (err) {
                throw err;
            }
            tab.loadFile(function (err) {
                workspaceView.send('workspace-create-and-focus-tab', err, tab, pane);
            });
        });
    });
}

/**
 * Open a file using the event from the explorer
 * @param event
 * @param {String|Object} file File to open
 */
function openFileFromExplorer(event, file) {
    openFile(file);
}

/**
 * Save the current active file
 */
function saveFile() {
    workspaceView.send('workspace-save-active-file');
}

/**
 * Save as the current active file
 */
function saveFileAs(){
    workspaceView.send('workspace-save-as-active-file');
}

/**
 * Save all files
 */
function saveAllFiles() {
    workspaceView.send('workspace-save-all-files');
}

/**
 * Return the structure of the resources directory of the current ADC
 * @param {Function} callback
 * @param {Object} callback.structure
 * @param {String[]} callback.structure.dynamic List of files in dynamic directory
 * @param {String[]} callback.structure.statics List of files in static directory
 * @param {String[]} callback.structure.share List of files in share directory
 */
function getResourcesDirectoryStructure(callback) {
    if (typeof callback !== 'function') {
        return;
    }

    var adc = global.project.adc;
    function buildFiles(dir, files) {
        var stats;
        var finalFiles = [];
        var i, l = files.length;

        for (i = 0; i < l; i++) {
            try {
                stats = fs.statSync(path.join(dir, files[i]));
            }
            catch (err2) {
                continue;
            }

            if (stats.isFile()) {
                finalFiles.push(files[i]);
            }
        }

        return finalFiles;
    }

    var structure = {};
    var sharePath = path.join(adc.path, 'resources/share');
    fs.readdir(sharePath, function onReadShareDirectory(errShare, shareFiles) {
        structure.share = (!errShare) ? (buildFiles(sharePath, shareFiles) || []) : [];

        var staticPath = path.join(adc.path, 'resources/static');
        fs.readdir(staticPath, function onReadStaticDirectory(errStatic, staticFiles) {
            structure.statics = (!errStatic) ? (buildFiles(staticPath, staticFiles) || []) : [];

            var dynamicPath = path.join(adc.path, 'resources/dynamic');
            fs.readdir(dynamicPath, function onReadDynamicDirectory(errDynamic, dynamicFiles) {
                structure.dynamic = (!errDynamic) ? (buildFiles(dynamicPath, dynamicFiles) || []) : [];
                callback(structure);
            });
        });
    });
}

/**
 * Open project settings
 */
function openProjectSettings() {
    tryIfADC(function tryToOpenProjectSettings(adc) {
        if (!adc || !adc.path) {
            return;
        }
        workspace.find(adc.path, function (err, tab, pane) {

            // If the tab already exist only focus it
            if (tab) {
                // TODO::Look if the content of the tab has changed
                // TODO::Look if the file has been removed
                workspaceView.send('workspace-focus-tab', err, tab, pane);
                return;
            }

            // When the tab doesn't exist, create it
            workspace.createTab({
                path : adc.path,
                type : 'projectSettings'
            }, function (err, tab, pane) {
                // TODO::Don't throw the error but send it to the view
                if (err) {
                    throw err;
                }
                getResourcesDirectoryStructure(function (structure) {
                    adc.load(function (err) {
                        tab.adcConfig = (!err)  ? adc.configurator.get() : {};
                        tab.adcStructure = structure;

                        workspaceView.send('workspace-create-and-focus-tab', err, tab, pane);
                    });
                });
            });
        });
    });
}

/**
 * Open the ADX preview
 * @param {Object} options Options
 * @param {Number} options.httpPort HTTP Port listen
 * @param {Number} options.wsPort WS port listen
 */
function openPreview(options) {
    var adc = global.project.adc;
    if (!adc || !adc.path) {
        return;
    }

    workspace.find('::preview', function (err, tab, pane) {

        // If the tab already exist only focus it
        if (tab) {
            workspaceView.send('workspace-focus-tab', err, tab, pane);
            return;
        }

        // When the tab doesn't exist, create it
        // and enforce his creation on the second panel by default
        workspace.createTab({
            name : 'Preview',
            path : '::preview', 
            type : 'preview'
        }, 'second',  function (err, tab, pane) {
            if (err) {
                throw err
            }
            tab.ports     = {
                http : options.httpPort,
                ws   : options.wsPort
            };
            workspaceView.send('workspace-create-and-focus-tab', err, tab, pane);
        });
    });
}

/**
 * Start the preview servers
 */
function startPreview() {
    tryIfADC(function tryToStartPreview(adc) {
        if (!adc || !adc.path) {
            return;
        }

        adc.checkFixtures(function () {
            servers.listen(openPreview);
        });
    });
}



/**
 * Set the current tab
 * @param event
 * @param {String} tabId Id of the tab
 */
function onSetCurrentTab(event, tabId) {
    workspace.find(tabId, function (err, tab) {
        if (err) {
            return;
        }
        workspace.currentTab(tab);
    });
}

/**
 * Close a tab
 * @param event
 * @param {String} tabId Id of the tab to close
 */
function onCloseTab(event, tabId) {
    workspace.removeTab(tabId, function (err, tab, pane) {
        workspaceView.send('workspace-remove-tab', err, tab, pane);
    });
}

/**
 * Close all tabs
 * @param event
 * @param {Object} [options]
 * @param {String} [options.except] Id of the tab to not closed
 */
function onCloseAllTabs(event, options) {
    workspace.removeAllTabs(options, function (err, removedTabs) {
        workspaceView.send('workspace-remove-tabs', err, removedTabs);
    });
}

/**
 * Move a tab into another pane
 * @param {Event} event
 * @param {String} tabId Id of the tab to move
 * @param {String} targetPane Pane to target
 */
function onMoveTab(event, tabId, targetPane) {
    workspace.moveTab(tabId, targetPane, function (err, tab, pane) {
        workspaceView.send('workspace-change-tab-location', err, tab, pane);
    });    
}

/**
 * On edit content
 * @param event
 * @param {String} tabId Id of the tab
 */
function onEditContent(event, tabId) {
    workspace.find(tabId, function (err, tab) {
        if (err) {
            return;
        }
        tab.edited = true;
    });
}

/**
 * On restore content
 * @param event
 * @param {String} tabId Id of the tab
 */
function onRestoreContent(event, tabId) {
    workspace.find(tabId, function (err, tab) {
        if (err) {
            return;
        }
        tab.edited = false;
    });
}

/**
 * Save content
 * @param event
 * @param {String} tabId Id of the tab
 * @param {String} content Content to save
 */
function onSaveContent(event, tabId, content) {
    workspace.find(tabId, function (err, tab, pane) {
        if (err) {
            workspaceView.send('workspace-update-tab', err, null, null);
            return;
        }
        if (tab.type === 'projectSettings') {
            var adc = global.project.adc;
            if (!adc || !adc.path) {
                return;
            }

            adc.configurator.set(content);
            adc.configurator.save(function () {

                getResourcesDirectoryStructure(function (structure) {
                    tab.adcConfig = adc.configurator.get();
                    tab.adcStructure = structure;
                    workspaceView.send('workspace-update-tab', err, tab, pane);
                });

            });
        }
        else {
            tab.saveFile(content, function (err) {
                workspaceView.send('workspace-update-tab', err, tab, pane);
            });
        }
    });
}

/**
 * Save content as
 * @param event
 * @param {String} tabId Id of the tab
 * @param {String} content Content to save
 */
function onSaveContentAs(event, tabId, content) {
    workspace.find(tabId, function (err, tab, pane) {
        if (err) {
            return; // Do nothing
        }

        var fileExt,
            fileNameWithoutExt,
            parentDir;

        function showSaveDialog(fileContent) {
            var fileName = fileNameWithoutExt + ' - Copy' + fileExt;
            var defaultPath = path.join(parentDir, fileName);

            dialog.showSaveDialog({
                title     : 'Save As',
                properties: ['openFile'],
                defaultPath : defaultPath
            }, function onSaveDialog(filePath) {
                if (!filePath) {
                    return;
                }

                fs.writeFile(filePath, fileContent, { encoding : 'utf8'}, function (err) {
                    if (err) {
                        console.log("TODO::MANAGE ERROR");
                        console.log(err);
                        return;
                    }
                    openFile(filePath);
                });
            });
        }

        if (tab.type === 'projectSettings') {
            fileExt = '.xml';
            fileNameWithoutExt = 'Config';
            parentDir = tab.path;
            // Use a fresh instance of the configurator based on the same file
            var configurator = new ADCConfigurator(tab.path);
            configurator.load(function onLoadConfig(err) {
                if (err) {
                    return; // Do nothing
                }
                // Update the instance of the configurator with the new content
                configurator.set(content);
                // Save the xml
                showSaveDialog(configurator.toXml());
            });
        } else {
            fileExt = path.extname(tab.path);
            fileNameWithoutExt = path.basename(tab.path, fileExt);
            parentDir = path.join(tab.path, '..');
            showSaveDialog(content);
        }
    });
}

/**
 * Save the content and close the tab
 * @param event
 * @param {String} tabId Id of the tab
 * @param {String} content Content to save
 */
function onSaveContentAndClose(event, tabId, content) {
    workspace.find(tabId, function (err, tab) {
        if (err) {
            return;
        }
        if (tab.type === 'projectSettings') {
            var adc = global.project.adc;
            if (!adc || !adc.path) {
                return;
            }

            adc.configurator.set(content);
            adc.configurator.save(function () {
                onCloseTab(event, tab.id);
            });
        }
        else {
            tab.saveFile(content, function () {
                onCloseTab(event, tab.id);
            });
        }
    });
}

/**
 * Confirm reload tab
 */
function onConfirmReload(event, tab, answer) {
    if (answer === 'yes') {
        workspace.find(tab, function (err, tab, pane) {
            if (!tab) {
                return;
            }
            tab.loadFile(function (err) {
                workspaceView.send('workspace-reload-tab', err, tab, pane);
            });
        });
    }
}

/**
 * When the file has changed
 */
function onFileChanged(tab, pane) {
    if (!tab.edited) {
        tab.loadFile(function (err) {
            workspaceView.send('workspace-reload-tab', err, tab, pane);
        });
    } else {
        app.emit('show-modal-dialog', {
            message  : "The file `" + tab.path + "` has been changed, do you want to reload it? ",
            type     : 'yesNo'
        }, 'workspace-reload-or-not-reload', tab);
    }
}


ipc.on('workspace-ready', function (event) {
    
    // Keep the connection with the view
    workspaceView = event.sender;
        
    // Initialize the workspace
    openProject();

    ipc.removeListener('explorer-load-file', openFileFromExplorer); // Remove it first to avoid duplicate event
    ipc.on('explorer-load-file', openFileFromExplorer); // Add it back again

    ipc.removeListener('workspace-set-current-tab', onSetCurrentTab);
    ipc.on('workspace-set-current-tab', onSetCurrentTab);

    ipc.removeListener('workspace-close-tab', onCloseTab);
    ipc.on('workspace-close-tab', onCloseTab);

    ipc.removeListener('workspace-close-all-tabs', onCloseAllTabs);
    ipc.on('workspace-close-all-tabs', onCloseAllTabs);

    ipc.removeListener('workspace-save-content', onSaveContent);
    ipc.on('workspace-save-content', onSaveContent);

    ipc.removeListener('workspace-save-content-as', onSaveContentAs);
    ipc.on('workspace-save-content-as', onSaveContentAs);

    ipc.removeListener('workspace-save-content-and-close', onSaveContentAndClose);
    ipc.on('workspace-save-content-and-close', onSaveContentAndClose);

    ipc.removeListener('workspace-edit-content', onEditContent);
    ipc.on('workspace-edit-content', onEditContent);

    ipc.removeListener('workspace-restore-content', onRestoreContent);
    ipc.on('workspace-restore-content', onRestoreContent);

    ipc.removeListener('workspace-move-tab', onMoveTab);
    ipc.on('workspace-move-tab', onMoveTab);

    app.removeListener('menu-open-project', reloadWorkspace);
    app.on('menu-open-project', reloadWorkspace);

    app.removeListener('menu-new-file', openFile);
    app.on('menu-new-file', openFile);

    app.removeListener('menu-open-file', openFile);
    app.on('menu-open-file', openFile);

    app.removeListener('menu-save-file', saveFile);
    app.on('menu-save-file', saveFile);

    app.removeListener('menu-save-file-as', saveFileAs);
    app.on('menu-save-file-as', saveFileAs);

    app.removeListener('menu-save-all-files', saveAllFiles);
    app.on('menu-save-all-files', saveAllFiles);

    app.removeListener('menu-show-project-settings', openProjectSettings);
    app.on('menu-show-project-settings', openProjectSettings);

    app.removeListener('menu-preview', startPreview);
    app.on('menu-preview', startPreview);

    workspace.removeListener('file-changed', onFileChanged);
    workspace.on('file-changed', onFileChanged);

    ipc.removeListener('workspace-reload-or-not-reload', onConfirmReload);
    ipc.on('workspace-reload-or-not-reload', onConfirmReload);


});



