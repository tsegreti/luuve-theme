const { DetailsModal } = await import(
    window?._importmap?.imports?.["details-modal"] || "details-modal"
);

class PasswordModal extends DetailsModal {
    constructor() {
        super();

        if (this.querySelector('input[aria-invalid="true"]'))
            this.open({ target: this.querySelector("details") });
    }

    connectedCallback() {
        super.connectedCallback?.();

        this.addEventListener("click", (event) => {
            if (event.target.matches(".modal__content.popup-modal"))
                this.close();
        });
    }
}

export { PasswordModal };
