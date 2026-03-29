const _focusable = [
    "summary",
    "a[href]",
    "button:enabled",
    ".popup-modal__content-info",
    '[tabindex]:not([tabindex^=" - "])',
    "[draggable]",
    "area",
    "input:not([type=hidden]):enabled",
    "select:enabled",
    "textarea:enabled",
    "object",
    "iframe",
].join(",");

const getFocusable = (container) => {
    const elements =
        container && container.querySelectorAll
            ? Array.from(container.querySelectorAll(_focusable))
            : [];

    // offsetParent returns null when the element or any ancestor
    // has the display property set to none.
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
    return elements.filter((element) => element.offsetParent);
};

const getGlobalOffsetTop = (element) => {
    let offsetTop = 0;

    while (element) {
        offsetTop += element.offsetTop;
        element = element.offsetParent;
    }

    return offsetTop;
};

const fetchConfig = (type = "json") => {
    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: `application/${type}`,
        },
    };
};

const trapFocusHandlers = {};

const trapFocus = (container, elementToFocus = container) => {
    const elements = getFocusable(container);
    const first = elements[0];
    const last = elements[elements.length - 1];

    removeTrapFocus();

    trapFocusHandlers.focusin = (event) => {
        if (
            event.target !== container &&
            event.target !== last &&
            event.target !== first
        )
            return;

        document.addEventListener("keydown", trapFocusHandlers.keydown);
    };

    trapFocusHandlers.focusout = () => {
        document.removeEventListener("keydown", trapFocusHandlers.keydown);
    };

    trapFocusHandlers.keydown = (event) => {
        if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
            event.preventDefault();
            first.focus();
        }

        // On the first focusable element and tab backward, focus the last element.
        if (
            (event.target === container || event.target === first) &&
            event.shiftKey
        ) {
            event.preventDefault();
            last.focus();
        }
    };

    document.addEventListener("focusout", trapFocusHandlers.focusout);
    document.addEventListener("focusin", trapFocusHandlers.focusin);

    elementToFocus?.focus();
};

const removeTrapFocus = (elementToFocus = null) => {
    document.removeEventListener("focusin", trapFocusHandlers.focusin);
    document.removeEventListener("focusout", trapFocusHandlers.focusout);
    document.removeEventListener("keydown", trapFocusHandlers.keydown);

    elementToFocus && elementToFocus.focus();
};

const pauseAllMedia = () => {
    document.querySelectorAll(".js-youtube").forEach((video) => {
        video.contentWindow.postMessage(
            '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
            "*"
        );
    });
    document.querySelectorAll(".js-vimeo").forEach((video) => {
        video.contentWindow.postMessage('{"method":"pause"}', "*");
    });
    //document.querySelectorAll('video').forEach((video) => video.pause());
    document
        .querySelectorAll("product-model")
        .forEach((model) => model.modelViewerUI?.pause());
};

export {
    fetchConfig,
    getGlobalOffsetTop,
    pauseAllMedia,
    removeTrapFocus,
    trapFocus,
};
