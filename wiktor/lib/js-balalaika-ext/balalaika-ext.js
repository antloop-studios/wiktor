/**
 * @license Unlicense
 */

"use strict";

$.extend($, {
    trim: function(s, c) {
        if (c === "]") c = "\\]";
        if (c === "\\") c = "\\\\";
        return s.replace(new RegExp("^[" + c + "]+|[" + c + "]+$", "g"), "");
    },
    now: function() {
        return new Date().getTime();
    },
});

$.extend($.fn, {
    prepend: function(element) {
        element = $(element);
        this.forEach(node =>
            element.forEach(chunk => node.insertBefore(chunk, node.firstChild))
        );
        return this;
    },

    append: function(element) {
        element = $(element);
        this.forEach(node => element.forEach(chunk => node.appendChild(chunk)));
        return this;
    },

    appendTo: function(element) {
        element = $(element);
        this.forEach(node => {
            element.forEach(chunk => chunk.appendChild(node));
        });
        return this;
    },

    hasClass: function(className) {
        return !!this[0] && this[0].classList.contains(className);
    },

    addClass: function(className) {
        this.forEach(item =>
            item.classList.add.apply(item.classList, className.split(/\s/))
        );
        return this;
    },

    removeClass: function(className) {
        this.forEach(item =>
            item.classList.remove.apply(item.classList, className.split(/\s/))
        );
        return this;
    },

    replaceClass: function(a, b) {
        this.removeClass(a);
        this.addClass(b);
        return this;
    },

    swapClass: function(a, b) {
        if (this.hasClass(a)) {
            this.replaceClass(a, b);
        } else {
            this.replaceClass(b, a);
        }

        return this;
    },

    toggleClass: function(className) {
        if (this.hasClass(className)) {
            this.removeClass(className);
        } else {
            this.addClass(className);
        }
        return this;
    },

    siblings: function(of_type) {
        var siblings = [];
        var sibling = this[0].parentNode.firstChild;

        while (sibling) {
            if (
                sibling.nodeType === 1 &&
                sibling !== this[0] &&
                (of_type ? sibling.localName === of_type : true)
            ) {
                siblings.push(sibling);
            }
            sibling = sibling.nextSibling;
        }

        return $(siblings);
    },

    children: function(of_type) {
        return of_type ? $(of_type, this) : $(this[0].children);
    },

    parent: function() {
        return $(this[0].parentNode);
    },

    toggle: function() {
        if (this[0]) this[0].hidden = !this[0].hidden;
        return this;
    },

    show: function() {
        this[0].hidden = false;
        return this;
    },

    hide: function() {
        this[0].hidden = true;
        return this;
    },

    is_visible: function() {
        return this[0] && !this[0].hidden;
    },

    is_hidden: function() {
        return this[0] && this[0].hidden;
    },

    html: function(content) {
        if (
            typeof content != "object" ||
            (typeof content == "string" && content.trim()[0] != "<")
        ) {
            this.forEach(node => {
                node.innerText = content;
            });
        } else {
            content = $(content);
            this.forEach(node => {
                content.forEach(e => node.appendChild(e));
            });
        }
        return this;
    },
});
