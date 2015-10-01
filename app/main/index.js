(function () {
  var ipc = require('ipc'),
      exp = document.getElementById("explorer"),
      wks = document.getElementById("workspace"),
      askia = window.askia,
      countDownReadyWebView = 2; // 2 web-views must be loaded

    function catchConsoleLog(event) {
      console.log(event.message);
    }

    /**
     * Look how many web-views are loaded and fire the ready event when all are ready
     */
    function onWebViewLoaded(){
      countDownReadyWebView--;
      if (!countDownReadyWebView) {
          // Resizer between the explorer element and the workspace
          var resExpl = new askia.Resizer({
              element  : document.getElementById('panel_explorer'),
              direction: 'horizontal'
          });

          resExpl.start();
          ipc.send('main-ready');
      }
    }

    exp.addEventListener('console-message', catchConsoleLog);
    wks.addEventListener('console-message', catchConsoleLog);

    // Dev tools of the webview
    exp.addEventListener("dom-ready", function(){
      onWebViewLoaded();
      exp.openDevTools();
    });
    wks.addEventListener("dom-ready", function(){
      onWebViewLoaded();
      wks.openDevTools();
    });


    /**
     * Show modal dialog from webview
     */
    exp.addEventListener('ipc-message', function(event) {
        if (event.channel === 'show-modal-dialog') {
            askia.modalDialog.show(event.args[0], function(result) {
                if (result.button === 'ok' || result.button === 'yes') {
                    var args = event.args.splice(1, event.args.length); // Remove the first arg
                    if (result.value) {
                        args.push(result.value);
                    }
                    ipc.send.apply(ipc, args);
                }
            });
        }

    });

    /**
     * Get the list of ADC templates
     */
    ipc.on('set-template-list', function (templates) {
        askia.modalDialog.adctemplates = templates;
    });

    /**
     * Show modal dialog from the controller
     */
    ipc.on('show-modal-dialog', function (options, callbackEventName) {
        var args = Array.prototype.slice.call(arguments, 1, arguments.length); // Remove the first args
        askia.modalDialog.show(options, function(result) {
            args.push(result.button);
            if (result.value) {
                args.push(result.value);
            }
            ipc.send.apply(ipc, args);
        });
    });
}());
