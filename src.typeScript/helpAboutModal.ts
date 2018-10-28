namespace com.mordritch.mcSim {
    export class helpAboutModal {
        private modal: guiFullModal;
        private L10n: localization;

        constructor(gui: gui) {
            this.L10n = gui.localization;

            this.modal = new guiFullModal(gui, false);
            // this.modal.addButton({
            //     label: this.L10n.getString("button.text.ok"),
            //     onActivateFunction: () => {
            //         this.modal.hide();
            //     }});
        }

        show(): void {
            this.modal.setContent(
                '<div class="documentInfo standardForm">' +
                    '<p><b>'+this.L10n.getString("helpAboutModal.title")+'</b></p>' +
                    '<p>Created by Jonathan Lydall (Mordritch)</p>' +
                '</div>'
            );
            this.modal.show();
        }
    }
}