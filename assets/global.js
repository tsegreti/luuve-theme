const serializeForm = (form) => {
    const obj = {};
    const formData = new FormData(form);
    for (const key of formData.keys()) {
        obj[key] = formData.get(key);
    }
    return JSON.stringify(obj);
};

function fetchSectionHTML(
    sectionId,
    useCache = false,
    path = window.location.pathname
) {
    const cacheKey = `${path}::${sectionId}`;

    if (typeof this.fetched === "undefined") this.fetched = {};

    if (useCache && this.fetched[cacheKey])
        return new Promise((resolve, reject) => {
            resolve(this.fetched[cacheKey]);
        });
    else {
        return fetch(
            path +
                (path.indexOf("?") === -1 ? "?" : "&") +
                `section_id=${sectionId}`
        )
            .then((result) => {
                if (result.ok) return result.text();
                else throw new Error(result.status);
            })
            .then((html) => {
                const innerHTML = new DOMParser()
                    .parseFromString(html, "text/html")
                    .querySelector(".shopify-section").innerHTML;

                if (useCache) this.fetched[cacheKey] = innerHTML;

                return innerHTML;
            });
    }
}

let subscribers = {};
const PUB_SUB_EVENTS = {
    cartUpdate: "cart-update",
    cartUpdateRequested: "cart-update-requested",
    fetcherUpdate: "fetcher-update",
    quantityUpdate: "quantity-update",
    variantChange: "variant-change",
    windowResizeX: "window-resize-x",
    windowScroll: "window-scroll",
};

function subscribe(eventName, callback) {
    if (subscribers[eventName] === undefined) {
        subscribers[eventName] = [];
    }

    subscribers[eventName] = [...subscribers[eventName], callback];

    return function unsubscribe() {
        subscribers[eventName] = subscribers[eventName].filter((cb) => {
            return cb !== callback;
        });
    };
}

function publish(eventName, data) {
    if (subscribers[eventName]) {
        subscribers[eventName].forEach((callback) => {
            callback(data);
        });
    }
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
    window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
    return function () {
        return fn.apply(scope, arguments);
    };
};

Shopify.setSelectorByValue = function (selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
        var option = selector.options[i];
        if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
        }
    }
};

Shopify.addListener = function (target, eventName, callback) {
    target.addEventListener
        ? target.addEventListener(eventName, callback, false)
        : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
    options = options || {};
    var method = options["method"] || "post";
    var params = options["parameters"] || {};

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);
        form.appendChild(hiddenField);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
    country_domid,
    province_domid,
    options
) {
    this.countryEl = document.getElementById(country_domid);
    this.provinceEl = document.getElementById(province_domid);
    this.provinceContainer = document.getElementById(
        options["hideElement"] || province_domid
    );

    Shopify.addListener(
        this.countryEl,
        "change",
        Shopify.bind(this.countryHandler, this)
    );

    this.initCountry();
    this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
    initCountry: function () {
        var value = this.countryEl.getAttribute("data-default");
        Shopify.setSelectorByValue(this.countryEl, value);
        this.countryHandler();
    },

    initProvince: function () {
        var value = this.provinceEl.getAttribute("data-default");
        if (value && this.provinceEl.options.length > 0) {
            Shopify.setSelectorByValue(this.provinceEl, value);
        }
    },

    countryHandler: function (e) {
        var opt = this.countryEl.options[this.countryEl.selectedIndex];
        var raw = opt.getAttribute("data-provinces");
        var provinces = JSON.parse(raw);

        this.clearOptions(this.provinceEl);
        if (provinces && provinces.length == 0) {
            this.provinceContainer.style.display = "none";
        } else {
            for (var i = 0; i < provinces.length; i++) {
                var opt = document.createElement("option");
                opt.value = provinces[i][0];
                opt.innerHTML = provinces[i][1];
                this.provinceEl.appendChild(opt);
            }

            this.provinceContainer.style.display = "";
        }
    },

    clearOptions: function (selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    },

    setOptions: function (selector, values) {
        for (var i = 0, count = values.length; i < values.length; i++) {
            var opt = document.createElement("option");
            opt.value = values[i];
            opt.innerHTML = values[i];
            selector.appendChild(opt);
        }
    },
};

(() => {
    let innerWidth = window.innerWidth;

    window.addEventListener(
        "resize",
        debounce(() => {
            if (innerWidth !== window.innerWidth) {
                innerWidth = window.innerWidth;
                publish(PUB_SUB_EVENTS.windowResizeX, undefined);
            }
        }, 200)
    );

    window.addEventListener(
        "scroll",
        debounce(() => {
            publish(PUB_SUB_EVENTS.windowScroll, undefined);
        }, 50),
        false
    );
})();

import("deferred")
    // _importmap is fallback for browsers that don't support importmap
    // it's pretty new feature. fully suported since 2023
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
    // we can remove it once iOS 16 is deprecated
    .catch((error) => {
        window._importmap = JSON.parse(
            document.querySelector('[type="importmap"]').innerHTML
        );

        import(window._importmap.imports?.["deferred"]);
        console.warn(
            "Browser has no support of importmap for JavaScript modules."
        );
    });
