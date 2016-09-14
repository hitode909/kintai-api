(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var phantomjsRequire = require;

var KintaiClient = function () {
    function KintaiClient(timecardURL, username, password) {
        _classCallCheck(this, KintaiClient);

        this.timecardURL = timecardURL;
        this.username = username;
        this.password = password;
    }

    _createClass(KintaiClient, [{
        key: 'createPage',
        value: function createPage() {
            var page = phantomjsRequire('webpage').create();
            page.viewportSize = {
                width: 1280,
                height: 800
            };
            page.onConsoleMessage = function (msg) {
                return console.log(msg);
            };
            page.onError = function (msg) {
                return console.log('in page error: ' + msg);
            };
            return page;
        }
    }, {
        key: 'auth',
        value: function auth(page) {
            page.evaluate(function (tupple) {
                var userName = tupple[0];
                var password = tupple[1];
                var userNameElement = document.querySelector('input[type="text"]');
                if (!userNameElement) {
                    throw "userNameElement not found";
                }
                userNameElement.value = userName;

                var passwordElement = document.querySelector('input[type="password"]');
                if (!passwordElement) {
                    throw "passwordElement not found";
                }
                passwordElement.value = password;
            }, [this.username, this.password]);
        }
    }, {
        key: 'getElementCenterPosition',
        value: function getElementCenterPosition(page, selector) {
            var position = page.evaluate(function (selectorInPage) {
                var button = document.querySelector(selectorInPage);
                if (!button) {
                    throw 'selector ' + selectorInPage + ' not found';
                }
                return button.getBoundingClientRect();
            }, selector);

            return [position.left + position.width * 0.5, position.top + position.height * 0.5];
        }
    }, {
        key: 'click',
        value: function click(page, position) {
            page.sendEvent('click', position[0], position[1]);
        }
    }, {
        key: 'error',
        value: function error(message) {
            console.error(message);
            phantom.exit(1);
        }
    }, {
        key: 'getFrameURL',
        value: function getFrameURL(windowID, done) {
            var _this = this;

            var page = this.createPage();
            page.open(this.timecardURL, function (status) {
                if (status !== 'success') {
                    _this.error('Unable to open the page');
                }

                var url = page.evaluate(function () {
                    return document.querySelector('frame[src*="LANSAWEB"]').src;
                });
                var urlForID = url.replace(/EW\d{4}/, windowID);
                done(urlForID);
            });
        }
    }, {
        key: 'getDakokuURL',
        value: function getDakokuURL(done) {
            this.getFrameURL('EW1015', done);
        }
    }, {
        key: 'getReportURL',
        value: function getReportURL(done) {
            this.getFrameURL('EW1010', done);
        }
    }]);

    return KintaiClient;
}();

var AbstructKintai = function (_KintaiClient) {
    _inherits(AbstructKintai, _KintaiClient);

    function AbstructKintai() {
        _classCallCheck(this, AbstructKintai);

        return _possibleConstructorReturn(this, (AbstructKintai.__proto__ || Object.getPrototypeOf(AbstructKintai)).apply(this, arguments));
    }

    _createClass(AbstructKintai, [{
        key: 'run',
        value: function run(done) {
            var _this3 = this;

            this.getDakokuURL(function (url) {
                var page = _this3.createPage();
                page.open(url, function (status) {
                    if (status !== 'success') {
                        _this3.error('Unable to open the page');
                    }

                    _this3.perform(page, done);
                });
            });
        }
    }, {
        key: 'perform',
        value: function perform(page, done) {
            var _this4 = this;

            this.auth(page);

            var position = this.getElementCenterPosition(page, this.buttonSelector);

            this.click(page, position);

            page.onLoadFinished = function () {
                var message = page.evaluate(function () {
                    return document.querySelector('option').textContent;
                });

                var report = [];
                report.push(_this4.action + 'が完了しました');
                report.push('メッセージ: ' + message.trim());

                if (done) {
                    done(report.join("\n"));
                }
            };
        }
    }]);

    return AbstructKintai;
}(KintaiClient);

var Shukkin = function (_AbstructKintai) {
    _inherits(Shukkin, _AbstructKintai);

    function Shukkin() {
        _classCallCheck(this, Shukkin);

        return _possibleConstructorReturn(this, (Shukkin.__proto__ || Object.getPrototypeOf(Shukkin)).apply(this, arguments));
    }

    _createClass(Shukkin, [{
        key: 'command',
        get: function get() {
            return 'up';
        }
    }, {
        key: 'action',
        get: function get() {
            return '出勤';
        }
    }, {
        key: 'buttonSelector',
        get: function get() {
            return 'input[src*="start"]';
        }
    }]);

    return Shukkin;
}(AbstructKintai);

var Taikin = function (_AbstructKintai2) {
    _inherits(Taikin, _AbstructKintai2);

    function Taikin() {
        _classCallCheck(this, Taikin);

        return _possibleConstructorReturn(this, (Taikin.__proto__ || Object.getPrototypeOf(Taikin)).apply(this, arguments));
    }

    _createClass(Taikin, [{
        key: 'command',
        get: function get() {
            return 'down';
        }
    }, {
        key: 'action',
        get: function get() {
            return '退勤';
        }
    }, {
        key: 'buttonSelector',
        get: function get() {
            return 'input[src*="end"]';
        }
    }]);

    return Taikin;
}(AbstructKintai);

var Report = function (_KintaiClient2) {
    _inherits(Report, _KintaiClient2);

    function Report() {
        _classCallCheck(this, Report);

        return _possibleConstructorReturn(this, (Report.__proto__ || Object.getPrototypeOf(Report)).apply(this, arguments));
    }

    _createClass(Report, [{
        key: 'run',
        value: function run(done) {
            var _this8 = this;

            this.getReportURL(function (url) {
                return _this8.gotURL(url, done);
            });
        }
    }, {
        key: 'gotURL',
        value: function gotURL(url, done) {
            var _this9 = this;

            var page = this.createPage();

            page.open(url, function (status) {
                if (status !== "success") {
                    _this9.error("Unable to open the page");
                }

                _this9.auth(page);

                var position = _this9.getElementCenterPosition(page, _this9.loginButtonSelector);
                _this9.click(page, position);

                page.onLoadFinished = function () {
                    // 月報開くコマンド
                    page.evaluate(function () {
                        return window.GotoMenuItem('EN4020', ' ');
                    });

                    page.onLoadFinished = function () {
                        _this9.collectReport(page, done);
                    };
                };
            });
        }
    }, {
        key: 'collectReport',
        value: function collectReport(page, done) {
            var result = page.evaluate(function () {
                var days_table = document.querySelector('#DUM_EZZOPCK-0001').parentNode.parentNode.parentNode.parentNode;
                var normalize = function normalize(text) {
                    return text.replace(/^\s*/, '').replace(/\s*$/, '');
                };

                var result = [];
                result.push("日付 打刻開始〜打刻終了 (開始時刻〜終了時刻)");
                Array.prototype.forEach.call(days_table.children, function (day) {
                    // tdを含まないtd
                    var columns = [];
                    Array.prototype.forEach.call(day.querySelector('tr').querySelectorAll('td'), function (td) {
                        if (!td.querySelector('td')) {
                            columns.push(td);
                        }
                    });

                    if (columns.length < 10) return;

                    // 日付, 打刻開始, 打刻終了, 開始時刻, 終了時刻
                    var date = normalize(columns[1].textContent);
                    var up1 = normalize(columns[6].textContent);
                    var down1 = normalize(columns[7].textContent);

                    var up2 = normalize(columns[8].textContent);
                    var down2 = normalize(columns[9].textContent);

                    if (up1.length > 0) {
                        result.push(date + ' ' + up1 + '〜' + down1 + ' (' + up2 + '〜' + down2 + ')');
                    } else {
                        result.push(date);
                    }
                });
                return result.join("\n");
            });

            done(result);
        }
    }, {
        key: 'loginButtonSelector',
        get: function get() {
            return 'input[name="&OK"]';
        }
    }]);

    return Report;
}(KintaiClient);

var system = phantomjsRequire('system');

var KintaiServer = function () {
    function KintaiServer(KINTAI_URL, KINTAI_STAFF_ID, KINTAI_PASSWORD, API_TOKEN, PORT) {
        _classCallCheck(this, KintaiServer);

        this.kintai_url = KINTAI_URL;
        this.staff_id = KINTAI_STAFF_ID;
        this.password = KINTAI_PASSWORD;
        this.api_token = API_TOKEN;
        this.port = PORT;
    }

    _createClass(KintaiServer, [{
        key: 'run',
        value: function run() {
            var _this10 = this;

            var WebServer = phantomjsRequire('webserver');
            var server = WebServer.create();
            server.listen(this.port, function (request, response) {
                var segments = request.url.split(/\?/);
                var path = segments[0];
                var parameters = segments[1];

                var controllers = {
                    '/': function _() {
                        _this10.performRoot(response);
                    },
                    '/up': function up() {
                        _this10.authorize(parameters, response, function () {
                            return _this10.performUp(response);
                        });
                    },
                    '/down': function down() {
                        _this10.authorize(parameters, response, function () {
                            return _this10.performDown(response);
                        });
                    },
                    '/report': function report() {
                        _this10.authorize(parameters, response, function () {
                            return _this10.performReport(response);
                        });
                    }
                };

                var controller = controllers[path];
                if (!controller) {
                    _this10.perform404(response);
                    return;
                }

                controller();
            });
            console.log('Server is runnning on ' + this.port + '.');
        }
    }, {
        key: 'setupCompleted',
        value: function setupCompleted() {
            return this.kintai_url && this.staff_id && this.password;
        }
    }, {
        key: 'authorize',
        value: function authorize(parameters, response, whenSuccess) {
            console.log('api_token=' + this.api_token);
            if (parameters !== 'api_token=' + this.api_token) {
                response.statusCode = 400;
                response.setHeader('Content-Type', 'text/plain; charset=utf-8');
                response.write('?api_token=*** required');
                response.close();
                return;
            }
            whenSuccess();
        }
    }, {
        key: 'performKintai',
        value: function performKintai(job, response) {
            var _this11 = this;

            if (this.setupCompleted()) {
                job.run(function (content) {
                    _this11.returnsText(content, response);
                });
            } else {
                response.statusCode = 400;
                response.setHeader('Content-Type', 'text/plain; charset=utf-8');
                response.write('Setup is not completed. Visit /');
                response.close();
            }
        }
    }, {
        key: 'returnsText',
        value: function returnsText(content, response) {
            response.statusCode = 200;
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            response.write(content);
            response.close();
        }
    }, {
        key: 'performRoot',
        value: function performRoot(response) {
            response.statusCode = 200;
            if (this.setupCompleted()) {
                response.write('# Kintai API\nWelcome, ' + this.staff_id + '!\n');
            } else {
                var message = '# Kintai API\nSet following kintai variables at heroku Dashboard (https://dashboard.heroku.com/).\n\n    KINTAI_URL=\'https://***\'\n    KINTAI_STAFF_ID=\'***\'\n    KINTAI_PASSWORD=\'***\'\n\nAnd you must set the API_TOKEN for authorization.\n\n    API_TOKEN=\'***\'\n';
                response.write(message);
            }
            response.close();
        }
    }, {
        key: 'performUp',
        value: function performUp(response) {
            var kintai = new Shukkin(this.kintai_url, this.staff_id, this.password);
            this.performKintai(kintai, response);
        }
    }, {
        key: 'performDown',
        value: function performDown(response) {
            var kintai = new Taikin(this.kintai_url, this.staff_id, this.password);
            this.performKintai(kintai, response);
        }
    }, {
        key: 'performReport',
        value: function performReport(response) {
            var report = new Report(this.kintai_url, this.staff_id, this.password);
            this.performKintai(report, response);
        }
    }, {
        key: 'perform404',
        value: function perform404(response) {
            response.statusCode = 404;
            response.write('Not Found');
            response.close();
        }
    }]);

    return KintaiServer;
}();

;

var server = new KintaiServer(system.env['KINTAI_URL'], system.env['KINTAI_STAFF_ID'], system.env['KINTAI_PASSWORD'], system.env['API_TOKEN'], system.env['PORT']);
server.run();

},{}]},{},[1]);
