class HTMLElementExt extends HTMLElement {
    constructor() {
        super();

        this.handles = {};
    }

    connectedCallback() {
        this.#processHandles("addEventListener");
    }

    #processHandles(methodName = "addEventListener") {
        Object.entries(this.handles).forEach(([key, cb]) => {
            let [event, selector, context] = key.split("::");
            if (context) {
                context =
                    context === "document"
                        ? document
                        : document.querySelector(context);
            } else {
                context = this;
            }

            (selector ? context.querySelectorAll(selector) : [context]).forEach(
                (el) => el[methodName](event, cb)
            );
        });
    }

    disconnectedCallback() {
        this.#processHandles("removeEventListener");
    }
}

export { HTMLElementExt };
