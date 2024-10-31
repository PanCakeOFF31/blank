Blank = class {

    constructor(pm) {
        this.pm = pm;
    }

    getJsonResponse() {
        const pm = this.pm;
        const responseText = pm.response.text();

        this.#expectJSON(responseText, "[Response] Body must be JSON-body")
        return JSON.parse(responseText);
    }

    getJsonRequest() {
        const pm = this.pm;
        const requestText = pm.request.body.toString();

        this.#expectJSON(requestText, "[Request] Body must be JSON-body")
        return JSON.parse(requestText);
    }

    /**
     * @param entries [[key, value, type, size]]
     */
    resHasKeys(entries, testName = "[Request] Json request has properties") {
        const pm = this.pm;
        const request = this.getJsonResponse();

        if (Array.isArray(entries[0])) {
            pm.test(testName, () => {
                for (const entry of entries) {
                    console.log("Проверка entry:", entry);

                    const [key, value = null, type = null, size = null] = entry;
                    console.log("Ожидаемые значения:", key, value, type, size);

                    // Просто проверка ключа
                    if (value === null && type === null) {
                        pm.expect(request).to.have.nested.property(key);
                        continue;
                    }

                    // Если есть значение и тип
                    if (value !== null && type !== null) {
                        pm.expect(request).to.have.nested.property(key, value);
                        pm.expect(this.#getNestedKey(request, key)).is.an(type);

                        if (type === "array" || type === "string") {
                            if (size !== null) {
                                pm.expect(this.#getNestedKey(request, key)).to.have.lengthOf(size);
                            }
                        }
                        continue;
                    }

                    // Если не значения, то можно проверить спокойно тип
                    if (type !== null)  {
                        pm.expect(request).to.have.nested.property(key);
                        pm.expect(this.#getNestedKey(request, key)).is.an(type);

                        if (type === "array" || type === "string") {
                            if (size !== null) {
                                pm.expect(this.#getNestedKey(request, key)).to.have.lengthOf(size);
                            }
                        }
                    }

                    // Без указания типа, размер даже не смотрится
                    if (value !== null) {
                        pm.expect(request).to.have.nested.property(key, value);
                    }
                }
            })
        } else {
            pm.test(testName, () => {
                 for (const key of entries) {
                    pm.expect(request).to.have.nested.property(key);
                 }
            });
        }


    }

    #getNestedKey(obj, path) {
        // Заменяем массивные индексы на точки
        const keys = path.replace(/\[(\w+)\]/g, '.$1').split('.');
        let current = obj;

        for (let key of keys) {
            if (current && key in current) {
                current = current[key];
            } else {
                return undefined; // Если ключ не найден, вернуть undefined
            }
        }

        return current; // Вернуть значение, если путь существует
    }

    #capitalizeWords(string) {
        return string.replace(/\b\w/g, char => char.toUpperCase());
    }

    #jsfy(content = null) {
        try {
            if (typeof content === "object" && content !== null) {
                return JSON.stringify(content);
            } else if (typeof content === "string") {
                return JSON.stringify(JSON.parse(content));
            } else {
                this.pm.expect.fail("Not valid JSON content");
            }
        } catch (e) {
            this.pm.expect.fail("JSON parse of content error")
        }
    }

    #isJSON(content = null) {
        try {
            JSON.parse(content);
            return true;
        } catch (e) {
            return false;
        }
    }

    #expectJSON(content = null, message = "Expected JSON") {
        const pm = this.pm;

        try {
            JSON.parse(content);
        } catch (e) {
            pm.expect.fail(message);
        }
    }

    resHasStatus(expectedStatus, testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Status must be ${expectedStatus}`;
        }

        pm.test(testName, () => {
            this.#expectStatus(expectedStatus);
        })
    }

    /**
     *
     * @param {string|int} status Ожидаемые значени:
     * - null,
     * - [400, 404, 501]
     * - "bad request"
     * - "client"/"server"/"client or server"
     * @param {string} text
     * @returns {undefined}
     *
     * @example Возможные варианты в качестве статуса:
     *  1) Статус как число:
     * expectStatus(status: 400, ...)
     *
     *  2) Стату как массив - один из:
     * expectStatus(status: [400, 404, 501], ...)
     *
     *  3) Статус как строка - без учета регистра
     * expectStatus(status: "bad request", ...)
     *
     * 4) Специальные значения - для группы:
     * expectStatus(status: "client", ...)
     */
    #expectStatus(status) {
        const pm = this.pm;
        const responseCode = pm.response.code;

        if (status !== null) {
            if (typeof status === "string") {
                const s = status.toLowerCase();

                if (s === "client") {
                    pm.expect(responseCode).to.be.at.least(400).and.below(500)
                } else if (s === "server") {
                    pm.expect(responseCode).to.be.at.least(500).and.below(600)
                } else if (s === "client or server") {
                    pm.expect(responseCode).to.be.at.least(400).and.below(600)
                } else {
                    if (s === "ok") {
                        pm.response.to.have.status(s.toUpperCase());
                    } else {
                        pm.response.to.have.status(this.#capitalizeWords(status));
                    }
                }
            } else if (Array.isArray(status)) {
                pm.expect(pm.response.code).to.be.oneOf(status)
            } else  {
                pm.response.to.have.status(status);
            }
        }
    }

    reqHasMethod(expectedMethod, testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Method must be ${expectedMethod.toUpperCase()}`;
        }

        pm.test(testName, () => {
            this.#expectMethod(expectedMethod);
        })
    }

    /**
     * @param {string} string
     * @param {string} string
     * @returns {undefined}
     */
    #expectMethod(expectedMethod) {
        const pm = this.pm;
        const requestMethod = pm.request.method;

        if (expectedMethod !== null) {
            pm.expect(requestMethod).is.deep.eql(expectedMethod.toUpperCase());
        }
    }

    reqHasBody(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Body must not be empty`;
        }

        pm.test(testName, () => {
            this.#expectBody(true, pm.request.body.toString());
        })
    }

    reqHasNotBody(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Body must be empty`;
        }

        pm.test(testName, () => {
            this.#expectBody(false, pm.request.body.toString());
        })
    }

    resHasBody(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Response] Body must not be empty`;
        }

        pm.test(testName, () => {
            this.#expectBody(true, pm.response.text());
        })
    }

    resHasNotBody(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Response] Body must be empty`;
        }

        pm.test(testName, () => {
            this.#expectBody(false, pm.response.text());
        })
    }

    /**
     * @param {boolean} body
     * @param {string} plainText содержимое на данный момент
     * @returns {undefined}
     */
    #expectBody(body, plainText = null) {
        const pm = this.pm;

        if (body !== null) {
            if (body) {
                pm.expect(plainText, "Body must be empty").is.not.empty;
            } else {
                if (plainText === null) {
                    pm.expect.fail("Body must be empty");
                } else {
                    pm.expect(plainText, "Body must be empty").is.empty;
                }
            }
        }
    }

    reqHasJson(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Body must not be empty but be json`;
        }

        pm.test(testName, () => {
            this.#expectJson(true, pm.request.body.toString());
        })
    }

    reqHasNotJson(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Body must be empty and not be json`;
        }

        pm.test(testName, () => {
            this.#expectJson(false, pm.request.body.toString());
        })
    }

    resHasJson(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Response] Body must not be empty but be json`;
        }

        pm.test(testName, () => {
            this.#expectJson(true, pm.response.text());
        })
    }

    resHasNotJson(testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Response] Body must be empty and not be json`;
        }

        pm.test(testName, () => {
            this.#expectJson(false, pm.response.text());
        })
    }

    /**
     * @param {boolean} json
     * @param {string} text
     * @returns {undefined}
     */
    #expectJson(json, jsonText) {
        const pm = this.pm;

        if (json !== null) {
            pm.expect(jsonText, "Body must not be empty").is.not.empty;

            if (json) {
                 this.#expectJSON(jsonText, "Body must be JSON-body")
            } else {
                pm.expect(this.#isJSON(jsonText), "Must not be JSON body").is.false;
            }
        }
    }

    reqHasContent(expectedContent, testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Body is equal to content`;
        }

        pm.test(testName, () => {
            this.#expectContent(expectedContent, false, pm.request.body.toString());
        })
    }

    reqHasJsonContent(expectedContent, testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Request] Body is equal to json content`;
        }

        pm.test(testName, () => {
            this.#expectContent(expectedContent, true, pm.request.body.toString());
        })
    }

    resHasContent(expectedContent, testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Response] Body is equal to content`;
        }

        pm.test(testName, () => {
            this.#expectContent(expectedContent, false, pm.response.text());
        })
    }

    resHasJsonContent(expectedContent, testName = null) {
        const pm = this.pm;
        if (testName === null) {
            testName = `[Response] Body is equal to json content`;
        }

        pm.test(testName, () => {
            this.#expectContent(expectedContent, true, pm.response.text());
        })
    }


    /**
     * @param {boolean} content
     * @param {boolean} json
     * @param {string} text
     * @returns {undefined}
     */
    #expectContent(content, json, contentText) {
        const pm = this.pm;

         if (content !== null) {
            if (content) {
                // Если есть содержимое, значит должен быть и тело ответа
                    pm.expect(contentText, "Body must not be empty").is.not.empty;

                // Если JSON-содержимое ответа то:
                if (json) {
                    this.#expectJSON(contentText, "Content must be JSON")
                    const jsfy = this.#jsfy(contentText);

                    if (typeof content === "object") {
                        pm.expect(this.#jsfy(jsfy), "Content is different").is.eql(this.#jsfy(content))
                    } else {
                        const converted = this.#jsfy(content);
                        pm.expect(this.#jsfy(jsfy), "Content is different").is.eql(converted)
                    }
                    // Содержимое сравнивается буквально
                } else {
                    pm.expect(contentText, "Content is different").is.eql(content)
                }
            } else {
                    pm.expect(contentText, "Body must not be empty").is.empty;
            }
        }
    }

    blankResponse(method = null, status = null, body = null, json = null, content = null) {
        const pm = this.pm;

        if (arguments.length === 0) {
            pm.expect.fail("Nothing to check");
        }

        if (arguments[0] !== null && typeof arguments[0] === "object") {
            const {
                method: m = null,
                status: s = null,
                body: b = null,
                json: j = null,
                content: c = null
            } = arguments[0];
            method = m;
            status = s;
            body = b;
            json = j;
            content = c;
        }

        pm.test(`[Response] Blank analysis`, () => {
            const responseText = pm.response.text();

            this.#expectMethod(method);
            this.#expectStatus(status);
            this.#expectBody(body, responseText);
            this.#expectJson(json, responseText);
            this.#expectContent(content, json, responseText);
        });
    }

    blankRequest(method = null, body = null, json = null, content = null) {
        if (arguments.length === 0) {
            pm.expect.fail("Nothing to check");
        }

        const pm = this.pm;

        if (arguments[0] !== null && typeof arguments[0] === "object") {
            const {
                method: m = null,
                body: b = null,
                json: j = null,
                content: c = null
            } = arguments[0];
            method = m;
            body = b;
            json = j;
            content = c;
        }

        pm.test(`[Request] Blank analysis`, () => {
            const requestText = pm.request.body.toString();

            this.#expectMethod(method);
            this.#expectBody(body, requestText);
            this.#expectJson(json, requestText);
            this.#expectContent(content, json, requestText);
        });
    }
}
