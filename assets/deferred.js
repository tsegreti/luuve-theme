const deferredItems = {};

const getLinkStylesheet = (href) => {
    return document.querySelector(`[rel="stylesheet"][href="${href}"]`);
};

const addLinkStylesheet = (href, onloadCb) => {
    let link = document.createElement("link");

    link.href = href;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.media = "all";
    link.onload = onloadCb;
    document.head.appendChild(link);
};

const loadStyle = (item) => {
    if (item.css) {
        let href = item.css;

        href = Array.isArray(href) ? href : [href];
        href = href.filter((h) => !getLinkStylesheet(h));
        item.css = {
            href: href,
            promise: Promise.all(
                href.map((href) => {
                    return new Promise((resolve, reject) => {
                        addLinkStylesheet(href, (event) => {
                            resolve(event.target);
                        });
                    });
                })
            ),
        };

        return item.css.promise;
    }
};

const getCustomElementName = (module) => {
    const { customElementName } = module;

    if (typeof customElementName !== "undefined") {
        return customElementName;
    }

    let moduleClass = Object.values(module)[0];
    if (moduleClass?.name && (moduleClass + "").indexOf("class ") === 0) {
        let name = moduleClass.name;

        // CamelCase to dashes
        name = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        // remove starting dash
        if (name.indexOf("-") === 0) name = name.substring(1);

        return name;
    }

    return false;
};

const load = (name, loaderTarget, loaderPosition = "beforeend") => {
    const _load = (name) => {
        const item = deferredItems[name];

        item?.depends?.forEach?.(load);
        item.promise = Promise.all([
            item.src &&
                import(window?._importmap?.imports?.[item.src] || item.src),
            loadStyle(item),
        ]);
        item.loaded = true;
    };

    if (deferredItems[name]?.loaded) return false; // already loaded

    (async () => {
        let loader;

        if (loaderTarget && loaderPosition) {
            let html = document.getElementById(
                "template__loading-overlay"
            )?.innerHTML;

            loaderTarget.insertAdjacentHTML(
                loaderPosition,
                html?.replace?.(" hidden", "")
            );
            loader = loaderTarget.querySelector(".loading-overlay");
        }

        _load(name);

        let [module] = await deferredItems[name].promise;
        if (module) {
            let elementName = getCustomElementName(module);

            if (elementName) {
                if (!customElements.get(elementName)) {
                    customElements.define(
                        elementName,
                        Object.values(module)[0]
                    );
                }

                await customElements.whenDefined(elementName);
            }
        }

        loader?.remove?.();
    })();

    return true; // loading started
};

const processReveal = () => {
    Object.entries(deferredItems)
        .filter(([name, settings]) => settings.reveal)
        .filter(([name, settings]) => {
            if (settings.reveal === "body") {
                // load script instantly when reveal is body
                // avoid creating unnecessary observers
                load(name);

                return false;
            }

            return true;
        })
        .forEach(([name, settings]) => {
            const revealObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    load(name);
                    revealObserver.disconnect();
                }
            });

            document
                .querySelectorAll(settings.reveal)
                .forEach((element) => revealObserver.observe(element));
        });
};

const processEvent = () => {
    const supportedEvents = ["input", "click", "submit"];
    const _getEventName = (str) => str && str.split("::")[0];

    Object.entries(deferredItems)
        .filter(
            ([name, settings]) =>
                supportedEvents.indexOf(_getEventName(settings.event || "")) !==
                -1
        )
        .forEach(([name, settings]) => {
            const eventName = _getEventName(settings.event);
            const selector = settings.event.replace(`${eventName}::`, "");
            const _handler = (event) => {
                let __iteration = 1;

                const element = event.target.closest(selector);
                const __dispatchEvent = async () => {
                    const module = await import(
                        window?._importmap?.imports?.[settings.src] ||
                            settings.src
                    );
                    let customElementName;

                    try {
                        customElementName = getCustomElementName(module);
                    } catch (error) {
                        // (tested 3/26/2024)
                        // Exception here occurs only for Safari browsers
                        // when module has top lever import with await.
                        // This recurcive call of __disaptchEvent can remove
                        // when you start to use importmap
                        // and 'import from ..' instead of 'await import(...)'
                        if (__iteration < 20) {
                            setTimeout(__dispatchEvent, 200);
                            __iteration++;
                        } else {
                            // Prevent infinit recursion.
                            console.log(
                                `We waited ${__iteration * 0.2}s for ${
                                    settings.src
                                } . It's too much. Skip it.`
                            );
                        }

                        return;
                    }

                    if (customElementName) {
                        await customElements.whenDefined(customElementName);
                    }

                    element.dispatchEvent(
                        new Event(eventName, {
                            bubbles: true,
                            cancelable: true,
                        })
                    );
                };

                if (!element) return;

                event.stopPropagation();
                event.preventDefault();

                let loaderTarget = element;
                if (element.tagName === "FORM") {
                    loaderTarget = element.add;
                }

                document.removeEventListener(eventName, _handler);
                if (load(name, loaderTarget)) {
                    // component loading started
                    // wait for it and dispatch event
                    __dispatchEvent();
                }
            };

            document.addEventListener(eventName, _handler);
        });
};

const processPubSubEvent = () => {
    Object.entries(deferredItems)
        .filter(([name, settings]) => settings.PUB_SUB_EVENT)
        .forEach(([name, settings]) => {
            const unsub = subscribe(settings.PUB_SUB_EVENT, () => {
                load(name);
                unsub();
            });
        });
};

const collectDeferred = (element) => {
    element
        .querySelectorAll('script[type="text/init-deferred"]')
        .forEach((script) => {
            const newDeferred = JSON.parse(script.textContent);

            Object.entries(newDeferred).forEach(([key, item]) => {
                if (!deferredItems[key]) {
                    deferredItems[key] = item;
                }
            });
            script.remove();
        });
};

const initialize = () => {
    collectDeferred(document);
    document
        .querySelectorAll('script[type="text/init-deferred"]')
        .forEach((script) => {
            const newDeferred = JSON.parse(script.textContent);

            Object.entries(newDeferred)
                .filter(([key, item]) => !deferredItems[key])
                .forEach(([key, item]) => {
                    deferredItems[key] = item;
                });
            script.remove();
        });

    processReveal();
    processEvent();
    processPubSubEvent();
};

const loadRevealFor = (element) => {
    Object.entries(deferredItems)
        .filter(([name, settings]) => settings.reveal && !settings.loaded)
        .forEach(([name, settings]) => {
            if (element.querySelector(settings.reveal)) load(name);
        });
};

// Some deferred components have popstate listeners.
// Add to state object name of the deferred component.
// And global listener below loads it once popstate event triggered.
window.addEventListener("popstate", (event) => {
    const name = event.state?.deferredName;

    if (name && load(name)) {
        // load returns `true` when deferred hasn't been
        // loaded before and loading started now
        let el = document.getElementById(event.state.id);
        if (el)
            el.afterLoadCallback = function () {
                this.onPopstate?.(event);
                delete this.afterLoadCallback;
            };
    }
});

// Listen secrion load/reload and initiazlize new components
if (Shopify?.designMode) {
    document.addEventListener("shopify:section:load", initialize);
}

// instantly initialize defered component
initialize();

export { collectDeferred, initialize, load, loadRevealFor, deferredItems };
