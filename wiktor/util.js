/**
 * @copyright Daniels Kursits (evolbug), 2019 <https://github.com/evolbug>
 * @license MIT license <https://opensource.org/licenses/MIT>
 */

class Url {
    static normalizedLocation() {
        return this.normalize(window.location);
    }

    static normalize(url) {
        url = new URL(url, window.location);

        let pathname = this.trim(url.pathname);
        pathname = pathname != "" ? `/${pathname}/` : "/";

        let search = this.trim(url.search.replace(/^(\?|\/)*/, ""));
        search = search ? "?" + search + "/" : "";

        let hash = this.trim(url.hash.replace(/^(\#|\/)*/, ""));
        hash = hash ? "#" + hash : "";

        return decodeURI(`${pathname}${search}${hash}`);
    }

    static trim(url) {
        return this.triml(this.trimr(url));
    }

    static triml(url) {
        return url.replace(/^\/+/, "");
    }

    static trimr(url) {
        return url.replace(/\/+$/, "");
    }

    static stripHost(link) {
        if (link.startsWith("http") || link.startsWith("//")) {
            let no_prot = link.replace(/(https?\:)\/\//, "");
            if (no_prot.startsWith(window.location.hostname)) {
                link = no_prot.replace(window.location.hostname, "");
            }
        }
        return link;
    }
}
