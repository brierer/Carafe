define(["./widget"], function(widget) {


    var validations = {
        v_integer: {
            fn: valid_integer,
            msg: "This is not valid integer!"
        },
        v_float: {
            fn: valid_float,
            msg: "This is not a valid float!"
        },
        v_file: {
            fn: valid_file,
            msg: "This is not a valid file!"
        },
        v_url: {
            fn: valid_url,
            msg: "This is not a valid url!"
        }
    }


    FunctionCreator = function(param) {
        if (!(this instanceof FunctionCreator)) {
            return new FunctionCreator(param);
        }

        this.title = param.title
        if (param.icon != undefined) {
            this.icon = param.icon
        } else {
            this.icon = ""
        }
        this.argument = param.argument
        this.callback = param.callback

    }

    SubList = function(title, fns) {
        if (!(this instanceof SubList)) {
            return new SubList(title, fns);
        }
        this.title = title
        this.fns = fns
        this.icon = "fa-sitemap"
    }

    var list = [
        SubList("Table", [
            FunctionCreator({
                'title': 'New Table',
                'icon': 'fa-table',
                'argument': {
                    nbcol: {
                        'title': 'Nb Col',
                        'validation': validations.v_integer
                    }
                },
                'callback': function(fn) {
                    widget.addTable(this.variable_name, fn.nbcol.value)
                }
            }),
            FunctionCreator({
                'title': 'Table from CSV FILE',
                'icon': 'fa-table',
                'argument': {
                    file: {
                        'title': 'File',
                        'type': 'file',
                        'validation': validations.v_file
                    },
                    header: {
                        'title': 'First Row Header',
                        'type': 'checkbox',
                        'validation': null
                    }
                },
                'callback': function(fn) {
                    var reader = new FileReader()
                    var variable_name = this.variable_name
                    reader.onload = function(e) {
                        var text = reader.result;
                        console.log(fn.header.value)
                        widget.addTableWithData(variable_name, processData(text), fn.header.value)
                    }
                    reader.readAsBinaryString(this.file)

                }
            }),
            FunctionCreator({
                'title': 'Table from CSV URL',
                'icon': 'fa-table',
                'argument': {
                    url: {
                        'title': 'URL',
                        'validation': validations.v_url
                    },
                    header: {
                        'title': 'First Row Header',
                        'type': 'checkbox',
                        'validation': null
                    }
                },
                'callback': function(fn) {
                    processURL(this.variable_name, fn)
                }
            })
        ]),
        SubList("Math", [FunctionCreator({
                'title': 'sum',
                'argument': [{
                    'title': 'x',
                    'validation': validations.v_float
                }, {
                    'title': 'y',
                    'validation': validations.v_float
                }],
                'callback': function() {
                    alert("asdf")
                }
            }),
            SubList("Stats", [FunctionCreator({
                'title': 'sum',
                'argument': [{
                    'title': 'x',
                    'validation': validations.v_float
                }, {
                    'title': 'y',
                    'validation': validations.v_float
                }],
                'callback': function() {
                    alert("asdf")
                }
            })])
        ])
    ]


    function valid_file(value) {
        console.log("YO")
        console.log((value.srcElement || value.target).files[0])
        return value
    }

    function valid_float(value) {
        var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;
        if (FLOAT_REGEXP.test(value)) {
            return parseFloat(value.replace(',', '.'));
        } else {
            return undefined;
        }
    }

    function valid_integer(value) {
        var REGEXP = /^\-?\d+$/;
        return REGEXP.test(value)
    }


    function valid_url(value) {
        var REGEXP = new RegExp(
            "^" +
            // protocol identifier
            "(?:(?:https?|ftp)://)" +
            // user:pass authentication
            "(?:\\S+(?::\\S*)?@)?" +
            "(?:" +
            // IP address exclusion
            // private & local networks
            "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
            "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
            "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            // IP address dotted notation octets
            // excludes loopback network 0.0.0.0
            // excludes reserved space >= 224.0.0.0
            // excludes network & broacast addresses
            // (first & last IP address of each class)
            "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
            "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
            "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
            "|" +
            // host name
            "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
            // domain name
            "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
            // TLD identifier
            "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
            ")" +
            // port number
            "(?::\\d{2,5})?" +
            // resource path
            "(?:/\\S*)?" +
            "$", "i"
        );
        return REGEXP.test(value)
    }


    function read_file(file) {
        console.log(JSON.stringify(file))
    }


    function processURL(variable_name, fn) {

        // Create the XHR object.
        function createCORSRequest(method, url) {
            var xhr = new XMLHttpRequest();
            if ("withCredentials" in xhr) {
                // XHR for Chrome/Firefox/Opera/Safari.
                xhr.open(method, url, true);
            } else if (typeof XDomainRequest != "undefined") {
                // XDomainRequest for IE.
                xhr = new XDomainRequest();
                xhr.open(method, url);
            } else {
                // CORS not supported.
                xhr = null;
            }
            return xhr;
        }



        // Make the actual CORS request.
        function makeCorsRequest() {
            // All HTML5 Rocks properties support CORS.
            var url = fn.url.value

            var xhr = createCORSRequest('GET', url);
            if (!xhr) {
                alert('CORS not supported');
                return;
            }

            // Response handlers.
            xhr.onload = function() {
                var text = xhr.responseText;
                widget.addTableWithData(variable_name, processData(text), fn.header.value)
            };

            xhr.onerror = function() {
                alert('Woops, there was an error making the request.');
            };

            xhr.send();
        }

        makeCorsRequest();
    }

    function processData(allText) {
        var allTextLines = allText.split(/\r\n|\n/);
        var headers = allTextLines[0].split(',');
        var lines = [];

        for (var i = 0;
            (i < allTextLines.length) && (i < 100); i++) {
            var data = allTextLines[i].split(',');
            if (data.length == headers.length) {

                var tarr = [];
                for (var j = 0; j < headers.length; j++) {
                    tarr.push(data[j]);
                }
                lines.push(tarr);
            }
        }
        return lines
    }

    return {

        list: list
    }
})
