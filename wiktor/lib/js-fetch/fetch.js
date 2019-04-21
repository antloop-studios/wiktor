/**
 * @copyright Daniels Kursits (evolbug), 2019 <https://github.com/evolbug>
 * @license MIT license <https://opensource.org/licenses/MIT>
 */

/**
 * @param {string} url
 * @param {{done:function, fail:function, alias:string, cache:object, async:boolean, contentType:string}} params
 */
function Fetch(url, params = {}) {
    var req = new XMLHttpRequest();
    if (params.done === undefined) params.done = () => {};
    if (params.fail === undefined) params.fail = () => {};
    if (params.alias === undefined) params.alias = url;

    req.onreadystatechange = () => {
        if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status == 200) {
                if (params.cache !== undefined) {
                    params.cache[params.alias] = {
                        url: url,
                        etag: req.getResponseHeader("etag"),
                        date: req.getResponseHeader("last-modified"),
                        data: req.responseText,
                    };
                }
                params.done(req.responseText, req);
            } else if (req.status == 304) {
                if (params.cache !== undefined) {
                    params.cache[params.alias] = params.cache[params.alias];
                    params.done(params.cache[params.alias].data, req);
                } else {
                    params.done(req.responseText, req);
                }
            } else {
                params.fail(req);
            }
        }
    };

    req.open("GET", url, params.async || true);

    if (params.cache !== undefined && params.cache[params.alias]) {
        req.setRequestHeader("If-None-Match", params.cache[params.alias].etag);
    } else if (params.cache === false) {
        req.setRequestHeader("Cache-Control", "no-cache");
    }

    if (params.contentType)
        req.setRequestHeader("Content-Type", params.contentType);

    req.send();
}
