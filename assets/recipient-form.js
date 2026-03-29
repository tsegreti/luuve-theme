class RecipientForm extends HTMLElement {
    constructor() {
        super();

        this.checkboxInput = this.querySelector(
            `#Recipient-checkbox-${this.dataset.sectionId}`
        );
        this.recipientFields = this.querySelector(".recipient-fields");
        this.hiddenControlField = this.querySelector(
            `#Recipient-control-${this.dataset.sectionId}`
        );
        this.hiddenControlField.disabled = true;
        this.emailInput = this.querySelector(
            `#Recipient-email-${this.dataset.sectionId}`
        );
        this.nameInput = this.querySelector(
            `#Recipient-name-${this.dataset.sectionId}`
        );
        this.messageInput = this.querySelector(
            `#Recipient-message-${this.dataset.sectionId}`
        );
        this.sendonInput = this.querySelector(
            `#Recipient-send-on-${this.dataset.sectionId}`
        );
        this.offsetProperty = this.querySelector(
            `#Recipient-timezone-offset-${this.dataset.sectionId}`
        );

        if (this.offsetProperty)
            this.offsetProperty.value = new Date().getTimezoneOffset();

        this.currentProductVariantId = this.dataset.productVariantId;
        this.addEventListener("change", this.onChange.bind(this));

        this.checkboxInput.addEventListener("input", (e) => {
            this.checkboxInput.checked ? this.show() : this.hide();
        });
    }

    cartUpdateUnsubscriber = undefined;
    variantChangeUnsubscriber = undefined;

    connectedCallback() {
        this.cartUpdateUnsubscriber = subscribe(
            PUB_SUB_EVENTS.cartUpdate,
            (event) => {
                if (
                    event.source === "product-form" &&
                    event.productVariantId.toString() ===
                        this.currentProductVariantId
                ) {
                    this.resetRecipientForm();
                }
            }
        );

        this.variantChangeUnsubscriber = subscribe(
            PUB_SUB_EVENTS.variantChange,
            (event) => {
                if (event.data.sectionId === this.dataset.sectionId) {
                    this.currentProductVariantId =
                        event.data.variant.id.toString();
                }
            }
        );
    }

    disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) this.cartUpdateUnsubscriber();

        if (this.variantChangeUnsubscriber) this.variantChangeUnsubscriber();
    }

    onChange() {
        if (this.checkboxInput.checked) {
            this.enableInputFields();
        } else {
            this.clearInputFields();
            this.disableInputFields();
        }
    }

    show() {
        var animation = this.recipientFields.animate(
            { height: ["0", this.recipientFields.scrollHeight + "px"] },
            { duration: 300, easing: "linear" }
        );

        animation.onfinish = () => {
            this.recipientFields.style.height = "initial";
        };
    }

    hide() {
        var animation = this.recipientFields.animate(
            { height: [this.recipientFields.clientHeight + "px", "0"] },
            { duration: 300, easing: "linear" }
        );

        animation.onfinish = () => {
            this.recipientFields.style.height = "0";
        };
    }

    inputFields() {
        return [
            this.emailInput,
            this.nameInput,
            this.messageInput,
            this.sendonInput,
        ];
    }

    disableableFields() {
        return [...this.inputFields(), this.offsetProperty];
    }

    clearInputFields() {
        this.inputFields().forEach((field) => (field.value = ""));
    }

    enableInputFields() {
        this.disableableFields().forEach((field) => (field.disabled = false));
    }

    disableInputFields() {
        this.disableableFields().forEach((field) => (field.disabled = true));
    }

    resetRecipientForm() {
        if (this.checkboxInput.checked) {
            this.checkboxInput.checked = false;
            this.clearInputFields();
        }
    }
}

export { RecipientForm };
