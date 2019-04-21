/**
 * @copyright Daniels Kursits (evolbug), 2019 <https://github.com/evolbug>
 * @license MIT license <https://opensource.org/licenses/MIT>
 */

class Persistor {
    constructor(key) {
        Object.defineProperty(this, "key", {
            value: key,
            enumerable: false,
        });

        Object.defineProperty(this, "old", {
            value: JSON.parse(localStorage[key] || "{}"),
            enumerable: false,
        });

        return new Proxy(this, {
            get: (target, key) =>
                target[key] != undefined ? target[key] : target.old[key],
            set: (target, key, value) => {
                target[key] = value;
                localStorage[target.key] = JSON.stringify(target);
                return true;
            },
        });
    }

    remember(key) {
        if (key && this[key] == undefined) {
            this[key] = this.old[key];
        } else {
            for (let key in this.old) {
                this[key] = this.old[key];
            }
        }
    }

    forget() {
        for (let key in this.old) {
            delete this.old[key];
        }
    }
}
