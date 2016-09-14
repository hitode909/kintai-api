'use strict';

let phantomjsRequire = require;

class KintaiClient {
    constructor (timecardURL, username, password) {
        this.timecardURL = timecardURL;
        this.username = username;
        this.password = password;
    }

    createPage () {
        const page = (phantomjsRequire('webpage')).create();
        page.viewportSize = {
            width: 1280,
            height: 800,
        };
        page.onConsoleMessage = msg => console.log(msg);
        page.onError = msg => console.log(`in page error: ${msg}`);
        return page;
    }

    auth (page) {
        page.evaluate(
            (tupple) => {
                const userName = tupple[0];
                const password = tupple[1];
                const userNameElement = document.querySelector('input[type="text"]');
                if (!userNameElement) { throw "userNameElement not found"; }
                userNameElement.value = userName;

                const passwordElement = document.querySelector('input[type="password"]');
                if (!passwordElement) { throw "passwordElement not found"; }
                passwordElement.value = password;
            },
            [this.username, this.password]
        );
    }

    getElementCenterPosition (page, selector) {
        const position = page.evaluate(
            (selectorInPage) => {
                const button = document.querySelector(selectorInPage);
                if (!button) { throw `selector ${selectorInPage} not found`; }
                return button.getBoundingClientRect();
            },
            selector
        );

        return [
            position.left + (position.width * 0.5),
            position.top  + (position.height * 0.5)
        ];
    }

    click (page, position) {
        page.sendEvent('click', position[0], position[1]);
    }


    error (message) {
        console.error(message);
        phantom.exit(1);
    }

    getFrameURL (windowID, done) {
        const page = this.createPage();
        page.open(
            this.timecardURL,
            (status) => {
                if (status !== 'success') { this.error('Unable to open the page'); }

                const url = page.evaluate(() => document.querySelector('frame[src*="LANSAWEB"]').src);
                const urlForID = url.replace(/EW\d{4}/, windowID);
                done(urlForID);
            }
        );
    }

    getDakokuURL (done) {
        this.getFrameURL('EW1015', done);
    }

    getReportURL (done) {
        this.getFrameURL('EW1010', done);
    }
}

class AbstructKintai extends KintaiClient {
    run (done) {
        this.getDakokuURL((url) => {
            const page = this.createPage();
            page.open(
                url,
                status => {
                    if (status !== 'success') { this.error('Unable to open the page'); }

                    this.perform(page, done);
                });
        });
    }

    perform (page, done) {
        this.auth(page);

        const position = this.getElementCenterPosition(page, this.buttonSelector);

        this.click(page, position);

        page.onLoadFinished = () => {
            const message = page.evaluate(() => (document.querySelector('option')).textContent);

            const report = [];
            report.push(`${ this.action }が完了しました`);
            report.push(`メッセージ: ${message.trim()}`);

            if (done) {
                done(report.join("\n"));
            }
        };
    }
}

class Shukkin extends AbstructKintai {
    get command () {
        return 'up';
    }
    get action () {
        return '出勤';
    }
    get buttonSelector () {
        return 'input[src*="start"]';
    }
}

class Taikin extends AbstructKintai {
    get command () {
        return 'down';
    }
    get action () {
        return '退勤';
    }
    get buttonSelector () {
        return 'input[src*="end"]';
    }
}

class Report extends KintaiClient {
    run (done) {
        this.getReportURL((url) => this.gotURL(url, done));
    }

    gotURL (url, done) {
        const page = this.createPage();

        page.open(
            url,
            status => {
                if (status !== "success") { this.error("Unable to open the page"); }

                this.auth(page);

                const position = this.getElementCenterPosition(page, this.loginButtonSelector);
                this.click(page, position);

                page.onLoadFinished = () => {
                    // 月報開くコマンド
                    page.evaluate(
                        () => window.GotoMenuItem('EN4020', ' ')
                    );

                    page.onLoadFinished = () => {
                        this.collectReport(page, done);
                    };
                };
            }
        );
    }

    collectReport (page, done) {
        const result = page.evaluate(() => {
            const days_table = document.querySelector('#DUM_EZZOPCK-0001').parentNode.parentNode.parentNode.parentNode;
            const normalize = text => (text.replace(/^\s*/, '')).replace(/\s*$/, '');

            const result = [];
            result.push("日付 打刻開始〜打刻終了 (開始時刻〜終了時刻)");
            Array.prototype.forEach.call(days_table.children, day => {
                // tdを含まないtd
                const columns = [];
                Array.prototype.forEach.call(day.querySelector('tr').querySelectorAll('td'), (td) => {
                    if (!td.querySelector('td')) {
                        columns.push(td);
                    }
                });

                if (columns.length < 10) return;

                // 日付, 打刻開始, 打刻終了, 開始時刻, 終了時刻
                const date  = normalize(columns[1].textContent);
                const up1   = normalize(columns[6].textContent);
                const down1 = normalize(columns[7].textContent);

                const up2   = normalize(columns[8].textContent);
                const down2 = normalize(columns[9].textContent);

                if (up1.length > 0) {
                    result.push(`${date} ${up1}〜${down1} (${up2}〜${down2})`);
                } else {
                    result.push(date);
                }
            });
            return result.join("\n");
        });

        done(result);
    }

    get loginButtonSelector () {
        return 'input[name="&OK"]';
    }
}

const system = phantomjsRequire('system');

class KintaiServer {
    constructor (KINTAI_URL, KINTAI_STAFF_ID, KINTAI_PASSWORD, API_TOKEN, PORT) {
        this.kintai_url = KINTAI_URL;
        this.staff_id = KINTAI_STAFF_ID;
        this.password = KINTAI_PASSWORD;
        this.api_token = API_TOKEN;
        this.port = PORT;
    }

    run () {
        const WebServer = phantomjsRequire('webserver');
        const server = WebServer.create();
        server.listen(
            this.port,
            (request, response) => {
                const segments = request.url.split(/\?/);
                const path = segments[0];
                const parameters = segments[1];

                const controllers = {
                    '/': () => {
                        this.performRoot(response);
                    },
                    '/up': () => {
                        this.authorize(parameters, response, () => this.performUp(response));
                    },
                    '/down': () => {
                        this.authorize(parameters, response, () => this.performDown(response));
                    },
                    '/report': () => {
                        this.authorize(parameters, response, () => this.performReport(response));
                    },
                };

                const controller = controllers[path];
                if (!controller) {
                    this.perform404(response);
                    return;
                }

                controller();
            }
        );
        console.log(`Server is runnning on ${this.port}.`);
    }

    setupCompleted () {
        return this.kintai_url && this.staff_id && this.password && this.api_token;
    }

    authorize (parameters, response, whenSuccess) {
        if (parameters !== `api_token=${this.api_token}`) {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            response.write('?api_token=*** required');
            response.close();
            return;
        }
        whenSuccess();
    }

    performKintai (job, response) {
        if (this.setupCompleted()) {
            job.run((content) => {
                this.returnsText(content, response);
            });
        } else {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            response.write('Setup is not completed. Visit /');
            response.close();
        }
    }

    returnsText (content, response) {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.write(content);
        response.close();
    }

    performRoot (response) {
        response.statusCode = 200;
        if (this.setupCompleted()) {
            response.write(`# Kintai API
Welcome, ${this.staff_id}!
`);
        } else {
            const message = `# Kintai API
Set following kintai variables at heroku Dashboard (https://dashboard.heroku.com/).

    KINTAI_URL='https://***'
    KINTAI_STAFF_ID='***'
    KINTAI_PASSWORD='***'

And you must set the API_TOKEN for authorization.

    API_TOKEN='***'
`;
            response.write(message);
        }
        response.close();
    }

    performUp (response) {
        const kintai = new Shukkin(this.kintai_url, this.staff_id, this.password);
        this.performKintai(kintai, response);
    }

    performDown (response) {
        const kintai = new Taikin(this.kintai_url, this.staff_id, this.password);
        this.performKintai(kintai, response);
    }

    performReport (response) {
        const report = new Report(this.kintai_url, this.staff_id, this.password);
        this.performKintai(report, response);
    }

    perform404 (response) {
        response.statusCode = 404;
        response.write('Not Found');
        response.close();
    }
};

const server = new KintaiServer(system.env['KINTAI_URL'], system.env['KINTAI_STAFF_ID'], system.env['KINTAI_PASSWORD'], system.env['API_TOKEN'], system.env['PORT']);
server.run();
